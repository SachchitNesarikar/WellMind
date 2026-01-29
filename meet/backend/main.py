import fastapi
from fastapi import FastAPI, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import sqlite3
import os
from dotenv import load_dotenv
import json

# Google APIs
from google.oauth2.credentials import Credentials
from google.oauth2 import service_account
from googleapiclient.discovery import build
from google.auth.transport.requests import Request as GoogleRequest
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

load_dotenv()
app = FastAPI()

from datetime import datetime, timedelta

@app.get("/therapists/{therapist_id}/slots")
async def get_available_slots(therapist_id: int, date: str):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    target_date = datetime.fromisoformat(date)
    day_of_week = target_date.weekday()

    # Get therapist's available time slots
    cursor.execute("""
        SELECT start_time, end_time FROM available_slots 
        WHERE therapist_id = ? AND day_of_week = ? AND is_available = 1
    """, (therapist_id, day_of_week))
    slots = cursor.fetchall()

    # Get booked appointments for that date
    cursor.execute("""
        SELECT scheduled_time FROM appointments 
        WHERE therapist_id = ? AND scheduled_date = ? AND status != 'cancelled'
    """, (therapist_id, date))
    booked_times = [row[0] for row in cursor.fetchall()]
    conn.close()

    # Filter out slots within next 24 hours
    now = datetime.utcnow()
    cutoff = now + timedelta(hours=24)

    available_slots = []
    for start, end in slots:
        current = datetime.strptime(start, "%H:%M")
        end_time = datetime.strptime(end, "%H:%M")

        while current < end_time:
            time_str = current.strftime("%H:%M")
            slot_datetime = datetime.combine(target_date.date(), current.time())

            if time_str not in booked_times and slot_datetime > cutoff:
                available_slots.append(time_str)

            current += timedelta(hours=1)

    return {"available_slots": available_slots}


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "therapy_booking.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Therapists table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS therapists (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        specialization TEXT,
        bio TEXT,
        calendar_id TEXT,
        google_credentials TEXT
    )
    """)
    
    # Available slots table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS available_slots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        therapist_id INTEGER,
        day_of_week INTEGER,
        start_time TEXT,
        end_time TEXT,
        is_available BOOLEAN DEFAULT 1,
        FOREIGN KEY (therapist_id) REFERENCES therapists(id)
    )
    """)
    
    # Appointments table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS appointments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        therapist_id INTEGER,
        client_name TEXT NOT NULL,
        client_email TEXT NOT NULL,
        client_phone TEXT,
        scheduled_date TEXT NOT NULL,
        scheduled_time TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        issues_tags TEXT,
        report_file TEXT,
        meet_link TEXT,
        calendar_event_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (therapist_id) REFERENCES therapists(id)
    )
    """)
    
    conn.commit()
    conn.close()

init_db()

# Models
class Therapist(BaseModel):
    name: str
    email: str
    specialization: str
    bio: Optional[str] = None

class AvailableSlot(BaseModel):
    therapist_id: int
    day_of_week: int
    start_time: str
    end_time: str

class BookingRequest(BaseModel):
    therapist_id: int
    client_name: str
    client_email: str
    client_phone: Optional[str] = None
    scheduled_date: str
    scheduled_time: str
    issues_tags: Optional[List[str]] = []
    report_file: Optional[str] = None

class AcceptAppointment(BaseModel):
    appointment_id: int

# Google Calendar & Meet Integration
SCOPES = ['https://www.googleapis.com/auth/calendar']

def get_calendar_service(credentials_json):
    """Get Google Calendar service"""
    try:
        creds_dict = json.loads(credentials_json)
        creds = service_account.Credentials.from_service_account_info(
            creds_dict, scopes=SCOPES
        )
        service = build('calendar', 'v3', credentials=creds)
        return service
    except Exception as e:
        print(f"Calendar service error: {e}")
        return None

def create_meet_event(therapist_email, client_email, client_name, date, time, therapist_credentials):
    """Create Google Calendar event with Meet link"""
    try:
        service = get_calendar_service(therapist_credentials)
        if not service:
            return None, None
        
        start_datetime = datetime.fromisoformat(f"{date}T{time}")
        end_datetime = start_datetime + timedelta(hours=1)
        
        event = {
            'summary': f'Therapy Session - {client_name}',
            'description': f'Therapy session with {client_name}',
            'start': {
                'dateTime': start_datetime.isoformat(),
                'timeZone': 'UTC',
            },
            'end': {
                'dateTime': end_datetime.isoformat(),
                'timeZone': 'UTC',
            },
            'attendees': [
                {'email': therapist_email},
                {'email': client_email},
            ],
            'conferenceData': {
                'createRequest': {
                    'requestId': f"meet-{datetime.now().timestamp()}",
                    'conferenceSolutionKey': {'type': 'hangoutsMeet'}
                }
            },
            'reminders': {
                'useDefault': False,
                'overrides': [
                    {'method': 'email', 'minutes': 24 * 60},
                    {'method': 'popup', 'minutes': 30},
                ],
            },
        }
        
        event = service.events().insert(
            calendarId='primary',
            body=event,
            conferenceDataVersion=1,
            sendUpdates='all'
        ).execute()
        
        meet_link = event.get('hangoutLink', 'N/A')
        event_id = event.get('id')
        
        return meet_link, event_id
    except Exception as e:
        print(f"Error creating event: {e}")
        return None, None

def send_email(to_email, subject, body):
    """Send email notification"""
    try:
        smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        sender_email = os.getenv("SENDER_EMAIL")
        sender_password = os.getenv("SENDER_PASSWORD")
        
        if not sender_email or not sender_password:
            print("Email credentials not configured")
            return False
        
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'html'))
        
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

# API Endpoints

@app.get("/therapists")
async def get_therapists():
    """Get list of all therapists"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT id, name, email, specialization, bio FROM therapists")
    therapists = cursor.fetchall()
    conn.close()
    
    return {
        "therapists": [
            {
                "id": t[0],
                "name": t[1],
                "email": t[2],
                "specialization": t[3],
                "bio": t[4]
            } for t in therapists
        ]
    }

@app.get("/therapists/{therapist_id}/slots")
async def get_available_slots(therapist_id: int, date: str):
    """Get available slots for a therapist on a specific date"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    target_date = datetime.fromisoformat(date)
    day_of_week = target_date.weekday()
    
    # Get therapist's available time slots
    cursor.execute("""
        SELECT start_time, end_time FROM available_slots 
        WHERE therapist_id = ? AND day_of_week = ? AND is_available = 1
    """, (therapist_id, day_of_week))
    
    slots = cursor.fetchall()
    
    # Get booked appointments for that date
    cursor.execute("""
        SELECT scheduled_time FROM appointments 
        WHERE therapist_id = ? AND scheduled_date = ? AND status != 'cancelled'
    """, (therapist_id, date))
    
    booked_times = [row[0] for row in cursor.fetchall()]
    conn.close()
    
    available_slots = []
    for start, end in slots:
        current = datetime.strptime(start, "%H:%M")
        end_time = datetime.strptime(end, "%H:%M")
        
        while current < end_time:
            time_str = current.strftime("%H:%M")
            if time_str not in booked_times:
                available_slots.append(time_str)
            current += timedelta(hours=1)
    
    return {"available_slots": available_slots}

@app.post("/book")
async def create_booking(booking: BookingRequest):
    """Create a new appointment booking"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    issues_tags_json = json.dumps(booking.issues_tags)
    
    cursor.execute("""
        INSERT INTO appointments 
        (therapist_id, client_name, client_email, client_phone, scheduled_date, 
         scheduled_time, issues_tags, report_file, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    """, (
        booking.therapist_id,
        booking.client_name,
        booking.client_email,
        booking.client_phone,
        booking.scheduled_date,
        booking.scheduled_time,
        issues_tags_json,
        booking.report_file
    ))
    
    conn.commit()
    appointment_id = cursor.lastrowid
    conn.close()
    
    return {
        "message": "Booking request sent successfully",
        "appointment_id": appointment_id,
        "status": "pending"
    }

@app.get("/therapist/{therapist_id}/dashboard")
async def get_therapist_dashboard(therapist_id: int):
    """Get therapist's dashboard data"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Get pending appointments
    cursor.execute("""
        SELECT id, client_name, client_email, client_phone, scheduled_date, 
               scheduled_time, issues_tags, report_file, created_at
        FROM appointments 
        WHERE therapist_id = ? AND status = 'pending'
        ORDER BY scheduled_date, scheduled_time
    """, (therapist_id,))
    
    pending = cursor.fetchall()
    
    # Get accepted appointments
    cursor.execute("""
        SELECT id, client_name, client_email, scheduled_date, scheduled_time, 
               issues_tags, report_file, meet_link, status
        FROM appointments 
        WHERE therapist_id = ? AND status = 'accepted'
        ORDER BY scheduled_date, scheduled_time
    """, (therapist_id,))
    
    accepted = cursor.fetchall()
    conn.close()
    
    return {
        "pending": [
            {
                "id": p[0],
                "client_name": p[1],
                "client_email": p[2],
                "client_phone": p[3],
                "scheduled_date": p[4],
                "scheduled_time": p[5],
                "issues_tags": json.loads(p[6]) if p[6] else [],
                "report_file": p[7],
                "created_at": p[8]
            } for p in pending
        ],
        "accepted": [
            {
                "id": a[0],
                "client_name": a[1],
                "client_email": a[2],
                "scheduled_date": a[3],
                "scheduled_time": a[4],
                "issues_tags": json.loads(a[5]) if a[5] else [],
                "report_file": a[6],
                "meet_link": a[7],
                "status": a[8]
            } for a in accepted
        ]
    }

@app.post("/therapist/accept")
async def accept_appointment(accept: AcceptAppointment):
    """Accept appointment and create Meet link"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Get appointment details
    cursor.execute("""
        SELECT a.therapist_id, a.client_name, a.client_email, a.scheduled_date, 
               a.scheduled_time, t.email, t.google_credentials, t.name
        FROM appointments a
        JOIN therapists t ON a.therapist_id = t.id
        WHERE a.id = ?
    """, (accept.appointment_id,))
    
    result = cursor.fetchone()
    if not result:
        conn.close()
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    therapist_id, client_name, client_email, sched_date, sched_time, therapist_email, creds, therapist_name = result
    
    # Create Google Meet event
    meet_link, event_id = create_meet_event(
        therapist_email, client_email, client_name, 
        sched_date, sched_time, creds
    )
    
    if not meet_link:
        meet_link = "Manual setup required"
    
    # Update appointment
    cursor.execute("""
        UPDATE appointments 
        SET status = 'accepted', meet_link = ?, calendar_event_id = ?
        WHERE id = ?
    """, (meet_link, event_id, accept.appointment_id))
    
    conn.commit()
    conn.close()
    
    # Send emails
    client_body = f"""
    <h2>Appointment Confirmed!</h2>
    <p>Dear {client_name},</p>
    <p>Your therapy session has been confirmed.</p>
    <p><strong>Therapist:</strong> {therapist_name}</p>
    <p><strong>Date:</strong> {sched_date}</p>
    <p><strong>Time:</strong> {sched_time}</p>
    <p><strong>Google Meet Link:</strong> <a href="{meet_link}">{meet_link}</a></p>
    """
    
    therapist_body = f"""
    <h2>Appointment Accepted</h2>
    <p>You have accepted an appointment with {client_name}</p>
    <p><strong>Date:</strong> {sched_date}</p>
    <p><strong>Time:</strong> {sched_time}</p>
    <p><strong>Google Meet Link:</strong> <a href="{meet_link}">{meet_link}</a></p>
    """
    
    send_email(client_email, "Therapy Appointment Confirmed", client_body)
    send_email(therapist_email, "Appointment Accepted", therapist_body)
    
    return {
        "message": "Appointment accepted successfully",
        "meet_link": meet_link,
        "calendar_event_id": event_id
    }

@app.post("/therapists")
async def add_therapist(therapist: Therapist):
    """Add new therapist (admin endpoint)"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO therapists (name, email, specialization, bio)
        VALUES (?, ?, ?, ?)
    """, (therapist.name, therapist.email, therapist.specialization, therapist.bio))
    
    conn.commit()
    therapist_id = cursor.lastrowid
    conn.close()
    
    return {"message": "Therapist added", "therapist_id": therapist_id}

@app.post("/slots")
async def add_slot(slot: AvailableSlot):
    """Add available slot for therapist"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute("""
        INSERT INTO available_slots (therapist_id, day_of_week, start_time, end_time)
        VALUES (?, ?, ?, ?)
    """, (slot.therapist_id, slot.day_of_week, slot.start_time, slot.end_time))
    
    conn.commit()
    conn.close()
    
    return {"message": "Slot added successfully"}

