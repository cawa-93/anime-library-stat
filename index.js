import fs       from 'fs';
import {google} from 'googleapis';


function loadEnv() {
	const data = JSON.parse(fs.readFileSync('./anime-library-stat-7e3e8f063a25.json'))
	for (const dataKey in data) {
		process.env[dataKey.toUpperCase()] = data[dataKey]
	}
}

loadEnv()

const scopes = 'https://www.googleapis.com/auth/analytics.readonly'

const jwt = new google.auth.JWT(process.env.CLIENT_EMAIL, null, process.env.PRIVATE_KEY, scopes)


const view_id = '243841356'

async function getUsersRatingList() {
	const result = await google.analytics('v3').data.ga.get({
		'auth': jwt,
		'ids': 'ga:' + view_id,
		'start-date': '7daysAgo',
		'end-date': 'today',
		'dimensions': 'ga:clientID',
		'metrics': 'ga:sessions,ga:avgSessionDuration',
		'filters': 'ga:avgSessionDuration>0',
		// 'filters': 'ga:pagePathLevel1==/watch/;ga:avgSessionDuration>0',
		'max-results': '100',
		sort: '-ga:sessions,-ga:avgSessionDuration',
	})


	const userStats = new Map

	for (const [id, sessions, duration] of result.data.rows) {
		const stat = userStats.get(id) || 0
		userStats.set(id, stat + parseInt(sessions, 10) * parseFloat(duration))
	}

	return [...userStats.entries()].sort((a,b) => b[1] - a[1])
}

getUsersRatingList().then(rating => {
	const data = {
		updated_at: Date.now(),
		rating,
	}
	fs.writeFileSync('./stat.json', JSON.stringify(data), {encoding: 'utf8'})
})
