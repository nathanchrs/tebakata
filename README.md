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
- Useful RHC commands: `rhc setup`, `rhc setup -l <account-email>`, `rhc ssh tebakata`, `rhc apps`, `rhc show-app tebakata`

## Development

The server-side game logic is contained in `game.js`, in the Tebakata class.
The client-side game logic is mostly in `views\game.jade`.
The wordlist is available in JSON format in `wordlist.json`. Contributions are very welcome.
Contributions to the design of this site are also welcome.

### Todo

- Wordlist
- Better UI
- Online players count
- Add timestamp to events
- Tidy up code
- Add server-side event history
- Prevent answering if answerBox is empty
- Scoreboard filter
- Scoreboard live update using socket.io
- Game rooms with different word categories
- English version
- Facebook/Google/Twitter login, player profiles
- Achievements
- Password reset, email confirmation
- Player profile, stats graph
