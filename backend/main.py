from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse

app = FastAPI()

html = """
<!DOCTYPE html>
<html>
    <head>
        <title>Chat</title>
    </head>
    <body>
        <h1>WebSocket Chat</h1>
        <form action="" onsubmit="sendMessage(event)">
            <input type="text" id="messageText" autocomplete="off"/>
            <button>Send</button>
        </form>
        <ul id='messages'>
        </ul>
        <script>
            var ws = new WebSocket("ws://localhost:8000/ws/1");
            ws.onmessage = function(event) {
                var messages = document.getElementById('messages')
                var message = document.createElement('li')
                var content = document.createTextNode(event.data)
                message.appendChild(content)
                messages.appendChild(message)
            };
            function sendMessage(event) {
                var input = document.getElementById("messageText")
                ws.send(input.value)
                input.value = ''
                event.preventDefault()
            }
        </script>
    </body>
</html>
"""
#stores all active websocket connections
class ConnectionManager: 
    def __init__(self): 
        self.active_connections = {}

    async def connect(self, websocket:WebSocket, documentId:int):
        await websocket.accept()
        if documentId not in self.active_connections:
            self.active_connections[documentId] = []

        self.active_connections[documentId].append(websocket)

    def disconnect(self, websocket:WebSocket, documentId:int): 
        try: 
            self.active_connections[documentId].remove(websocket)
        except KeyError: 
            print(f"{documentId} could not be found")
    
    async def broadcast(self, message: str, documentId: int): 
        for connection in self.active_connections[documentId]:
            await connection.send_text(message)


manager = ConnectionManager()
@app.get("/")
async def get(): 
    return HTMLResponse(html)

@app.websocket("/ws/{document_id}")
async def websocket_endpoint(websocket: WebSocket, document_id: int): 
    await manager.connect(websocket, document_id)
    while True: 
        try:
            data = await websocket.receive_text()
            await manager.broadcast(f"message {data}", document_id)
        except WebSocketDisconnect: 
            manager.disconnect(websocket, document_id)
