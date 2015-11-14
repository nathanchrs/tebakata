# Tebakata

A word-guessing game by nathanchrs. Inspired by the game Acakata (www.acakata.com), which unfortunately won't run anymore. Built mainly using Node.js, Express, Passport, MongoDB with Mongoose and Socket.io.

## Setup

1. Install node.js
2. Install and run MongoDB
3. Navigate to project directory
4. Run `npm install`
5. Run `npm start` or `node server.js`

### Configuration

To set configuration other than the default specified in `server.js`, create a new `config.json` file.

Example:

```json
{
	"secret": "thisisasecretkey",
	"port": "3000",
	"ip": "localhost",
	"connectionstring": "mongodb://localhost/tebakata",
	"bcryptsaltworkfactor": "10",
	"countdown": "10"
}
```

## Deploying to Openshift

Currently an instance of Tebakata is available at tebakata-nathanchrs.rhcloud.com for testing.

To deploy to Openshift:

1. Navigate to project directory
2. Run `git remote add openshift -f <openshift-git-repo-url>`
3. Run `git merge openshift/master -s recursive -X ours`
4. Run `git push openshift HEAD:master`

Notes:

- Openshift may suspend the application if it idles (no HTTP request) for more than a day.
- Server time uses Openshift default time, not UTC+7.

## Development

The server-side game logic is contained in `game.js`, in the Tebakata class.
The client-side game logic is mostly in `views\game.jade`.
The wordlist is available in JSON format in `wordlist.json`. Contributions are very welcome.

### Todo

- Wordlist
- Tidy up code
- Add timestamp to events
- Add server-side event history
- Scoreboard live update using socket.io
- Better UI
- Game rooms with different word categories
- Online players count
- English version
- Facebook/Google/Twitter login
- Achievements
- Player profile, stats graph
