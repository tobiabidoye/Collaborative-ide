import React from 'react';
import { createRoot } from "react-dom/client";
import Editor from '@monaco-editor/react';
import useWebSocket, {ReadyState} from "react-use-websocket"


class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      code: '// type your code...',
      isConnected: false
    }
    this.websocket = null
  }
  editorDidMount(editor, monaco) {
    console.log('editorDidMount', editor);
    editor.focus();
  }
  onChange(newValue, e) {
    if(this.websocket && this.websocket.readyState === WebSocket.OPEN){
        this.websocket.send(newValue);
        console.log("send to backend");
    }else{
        console.log("websocket data did not send");
    }
  }
  render() {
    const code = this.state.code;
    const options = {
      selectOnLineNumbers: true
    };
    return (
      <Editor
        width="100%"
        height="100vh"
        language="python"
        theme="vs-dark"
        value={code}
        options={options}
        onChange={this.onChange.bind(this)}
        editorDidMount={this.editorDidMount.bind(this)}
      />
    );
  }
    componentDidMount(){
        this.websocket = new WebSocket("ws://localhost:8000/ws/1");
        this.websocket.addEventListener("open", (event) => {
            console.log("connected websocket");
            this.setState({isConnected: true});
            this.websocket.send("Connection established");
        });
        this.websocket.addEventListener("message", (event) => { 
            console.log("message from server", event.data);
        });

        this.websocket.addEventListener("close", (event) => { 
            console.log("connection closed");
            this.setState({isConnected: false})
        });
    

        this.websocket.addEventListener("error", (event) => { 
            console.error("websocket error", event);
            this.setState({isConnected: false})
        });

    }

    componentWillUnmount(){
        console.log("websocket unmounting");
        if(this.websocket){ 
            this.websocket.close();
        } 
    }
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);

export default App
