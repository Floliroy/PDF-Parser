require('dotenv').config()

const SERVICE_ACCT_ID = process.env.GOOGLE_EMAIL
const KEY = process.env.GOOGLE_TOKEN.replace(/\\n/g, '\n')
const TIMEZONE = "UTC+02:00"
const CALENDAR_ID = {
	"primary": "jgf6g9am89u2vj93824ck94j88@group.calendar.google.com"
}

module.exports.serviceAcctId = SERVICE_ACCT_ID
module.exports.key = KEY
module.exports.timezone = TIMEZONE
module.exports.calendarId = CALENDAR_ID
