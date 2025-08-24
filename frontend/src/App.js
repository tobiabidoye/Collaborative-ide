import React from 'react';
import { createRoot } from "react-dom/client";
import Editor from '@monaco-editor/react';
import useWebSocket, {ReadyState} from "react-use-websocket"


class App extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
        code: '// type your code...',
        isConnected: false,
        selectedLanguage: 'python'
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
    componentDidMount(){
        this.websocket = new WebSocket("ws://localhost:8000/ws/1");
        this.websocket.addEventListener("open", (event) => {
            console.log("connected websocket");
            this.setState({isConnected: true});
            this.websocket.send("Connection established");
        });
        this.websocket.addEventListener("message", (event) => { 
            console.log("message from server", event.data);
            this.setState({code : event.data})

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
    onLanguageChange(event){
        const newLanguage = event.target.value; 
        const newCode = this.getOrDefault(newLanguage);
        this.setState({
            selectedLanguage: newLanguage,
            code: newCode
        });

        if(this.websocket && this.websocket.readyState === WebSocket.OPEN){
            this.websocket.send(newCode)
        }
    }

    getOrDefault(language){
        const templates = {
            'javascript': 'console.log("Hello World");',
            'python': 'print("Hello World")',
            'java': 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello World");\n    }\n}',
            'cpp': '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello World" << endl;\n    return 0;\n}',
            'go': 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello World")\n}'
        };
        
        return templates[language] || '// Hello World';
    }


      render() {
        const code = this.state.code;
        const options = {
          selectOnLineNumbers: true
        };
        return (
            <div>
            {/* Language Selector */}
              <div style={{padding: '10px', backgroundColor: '#1e1e1e'}}>
                <select 
                  value={this.state.selectedLanguage} 
                  onChange={this.onLanguageChange.bind(this)}
                  style={{padding: '5px', fontSize: '14px'}}
                >
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="cpp">C++</option>
                  <option value="go">Go</option>
                  <option value="typescript">TypeScript</option>
                </select>
              </div>

          <Editor
            width="100%"
            height="100vh"
            language={this.state.selectedLanguage}         
            theme="vs-dark"
            value={code}
            options={options}
            onChange={this.onChange.bind(this)}
            editorDidMount={this.editorDidMount.bind(this)}
          />
            </div>
        );
      }
 
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<App />);

export default App
