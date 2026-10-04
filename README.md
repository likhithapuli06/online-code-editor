# Online Code Editor

A browser-based Online Code Editor developed as part of the **Slash Mark Full Stack Web Development Internship – Task 5**.

The application provides a simple IDE-like interface where users can write code, select a programming language, provide custom input, execute the code, and view the output or errors directly in the browser.

## Features

- Browser-based code editor
- Ace Editor integration
- Support for multiple programming languages
  - JavaScript
  - Python
  - Java
  - C++
- Syntax highlighting
- Language selection
- Custom input support
- Run Code functionality
- Output display
- Compilation error display
- Runtime error display
- Execution timeout protection
- Execution time display
- Reset code functionality
- Responsive user interface
- REST API backend
- Local code execution
- No Judge0 API key required
- No RapidAPI subscription required

## Technologies Used

### Frontend

- React.js
- Vite
- JavaScript
- HTML
- CSS
- Ace Editor

### Backend

- Node.js
- Express.js
- Child Process
- REST API

### Code Execution

The application uses local execution through the backend.

| Language | Runtime / Compiler |
|----------|--------------------|
| JavaScript | Node.js |
| Python | Python 3 |
| Java | JDK |
| C++ | g++ |

## Project Structure

```text
online-code-editor/
│
├── backend/
│   ├── package.json
│   ├── server.js
│   └── ...
│
├── frontend/
│   ├── public/
│   │   └── ace/
│   │       ├── ace.js
│   │       ├── mode-javascript.js
│   │       ├── mode-python.js
│   │       ├── mode-java.js
│   │       ├── mode-c_cpp.js
│   │       └── theme-monokai.js
│   │
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── main.jsx
│   │
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── README.md
└── .gitignore