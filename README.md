# WebSocket Relay

Scatter Bridge exists in a browser window so it can't open a websocket server on it.
Instead of having to deal with injection, domain locking or popup manipulation this
relay acts as a server that redirects websocket calls to the user's locally running Scatter
allowing for Bridge to act in the same way as Scatter Desktop.

