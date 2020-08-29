require('dotenv').config()

const SERVICE_ACCT_ID = process.env.GOOGLE_EMAIL
const KEY = process.env.GOOGLE_TOKEN.replace(/\\n/g, '\n')
const TIMEZONE = "UTC+02:00"
//const CALENDAR_URL = "https://calendar.google.com/calendar?cid=YTZrY2Z0aW0zbGxpa2Q1cGdsZGxxcWZtY29AZ3JvdXAuY2FsZW5kYXIuZ29vZ2xlLmNvbQ"
const CALENDAR_ID = {
	"primary": "a6kcftim3llikd5pgldlqqfmco@group.calendar.google.com"
}

module.exports.serviceAcctId = SERVICE_ACCT_ID
module.exports.key = KEY
module.exports.timezone = TIMEZONE
//module.exports.calendarUrl = CALENDAR_URL
module.exports.calendarId = CALENDAR_ID
