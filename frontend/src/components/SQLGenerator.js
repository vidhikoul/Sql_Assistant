import React, { useState, useRef, useEffect } from 'react';
import { Container, Card, Form, Button, Spinner, Navbar, Modal, Toast, Dropdown } from 'react-bootstrap';
import { Copy, Database, Magic, Eye, EyeSlash } from 'react-bootstrap-icons';
import Editor from '@monaco-editor/react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const SQLAssistant = () => {
  const navigate = useNavigate();
  const [leftPanelWidth, setLeftPanelWidth] = useState('30%');
  const dividerRef = useRef(null);
  const containerRef = useRef(null);

  // State for chat interface
  const [userQuery, setUserQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  
  // State for editor and execution
  const [editorQuery, setEditorQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [queryResult, setQueryResult] = useState(null);

  // State for database connection
  const [showModal, setShowModal] = useState(false);
  const [dbType, setDbType] = useState('mysql');
  const [dbConfig, setDbConfig] = useState({
    mysql: { host: '', port: '3306', user: '', password: '', database: '' },
    postgres: { host: '', port: '5432', user: '', password: '', database: '' },
    spark: { host: '', port: '10000', username: '', password: '' },
    trio: { host: '', port: '8080', username: '', password: '' }
  });
  const [connectionStatus, setConnectionStatus] = useState('');

  // State for ghost mode
  const [ghostMode, setGhostMode] = useState(false);
  const [showGhostSuggestion, setShowGhostSuggestion] = useState(false);
  const [ghostSuggestion, setGhostSuggestion] = useState('');
  const [isGeneratingGhostSuggestion, setIsGeneratingGhostSuggestion] = useState(false);

  // UI state
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const ghostModeRef = useRef(ghostMode);
  const [isDragging, setIsDragging] = useState(false);
  // Handle divider mouse down
  const handleDividerMouseDown = (e) => {
    setIsDragging(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };
  // Handle mouse move for divider
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    
    // Set min and max width constraints (20% to 60%)
    const clampedWidth = Math.max(20, Math.min(60, newWidth));
    setLeftPanelWidth(`${clampedWidth}%`);
  };

  // Handle mouse up for divider
  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  // Clean up event listeners
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Handle database configuration changes
  const handleDbConfigChange = (field, value) => {
    setDbConfig(prev => ({
      ...prev,
      [dbType]: {
        ...prev[dbType],
        [field]: value
      }
    }));
  };

  // Handle database connection
  const handleConnectDatabase = async () => {
    const currentConfig = dbConfig[dbType];
    const requiredFields = dbType === 'spark' || dbType === 'trio'
      ? ['host', 'port', 'username'] 
      : ['host', 'port', 'user', 'password', 'database'];
    
    const missingFields = requiredFields.filter(field => !currentConfig[field]);
    if (missingFields.length > 0) {
      setToastMessage(`Missing fields: ${missingFields.join(', ')}`);
      setShowToast(true);
      return;
    }

    try {
      const response = await fetch('http://localhost:5001/api/sql/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dbType,
          ...currentConfig
        }),
      });

      const result = await response.json();
      if (result.success) {
        setShowModal(false);
        setConnectionStatus(`${dbType.toUpperCase()}: ${currentConfig.database || currentConfig.host}`);
        setToastMessage('Connected to database successfully!');
        setShowToast(true);
      } else {
        throw new Error(result.message || 'Failed to connect');
      }
    } catch (error) {
      console.error('Connection error:', error);
      setToastMessage(`Connection failed: ${error.message}`);
      setShowToast(true);
    }
  };

  // Handle editor mount
  const handleEditorDidMount = (editor, monacoInstance) => {
    editorRef.current = editor;
    monacoRef.current = monacoInstance;
  
    editor.onKeyDown((e) => {
      if (e.code !== "Enter" || !ghostModeRef.current) return;

      const position = editor.getPosition();
      const model = editor.getModel();
      if (model) {
        const lineContent = model.getLineContent(position.lineNumber).trim();
        if (lineContent.startsWith("--")) {
          const comment = lineContent.substring(2).trim();
          if (comment) {
            handleGhostSuggestion(comment, position);
          }
        }
      }
    });
  };

  // Handle ghost mode suggestions
  const handleGhostSuggestion = async (comment, position) => {
    setIsGeneratingGhostSuggestion(true);
    try {
      const res = await axios.get('http://localhost:5001/api/sql/generate', { 
        params: { userQuery: comment }  
      });
      if (res.data.sql_query) {
        const formattedSQL = res.data.sql_query.replace(/```sql|```/g, '').trim();
        setGhostSuggestion(formattedSQL);
        setShowGhostSuggestion(true);
      }
    } catch (error) {
      console.error('Error generating SQL:', error);
      setToastMessage('Error generating SQL from comment!');
      setShowToast(true);
    } finally {
      setIsGeneratingGhostSuggestion(false);
    }
  };

  // Apply ghost suggestion to editor
  const applyGhostSuggestion = () => {
    if (!ghostSuggestion || !editorRef.current || !monacoRef.current) return;
    
    const position = editorRef.current.getPosition();
    const monaco = monacoRef.current;
    
    editorRef.current.executeEdits("insert-sql", [{
      range: new monaco.Range(position.lineNumber + 1, 1, position.lineNumber + 1, 1),
      text: "\n" + ghostSuggestion,
      forceMoveMarkers: true
    }]);
    
    setShowGhostSuggestion(false);
    setToastMessage('Ghost Writer applied the suggestion!');
    setShowToast(true);
  };

  // Toggle ghost mode
  const toggleGhostMode = () => {
    setGhostMode((prev) => {
      const newState = !prev;
      ghostModeRef.current = newState;
      return newState;
    });
    
    setToastMessage(`Ghost Mode ${ghostMode ? 'disabled' : 'enabled'}`);
    setShowToast(true);
  };

  // Generate SQL from natural language
  const generateSQL = async () => {
    if (!userQuery.trim()) return;
    
    setLoading(true);
    const newChatEntry = { type: 'user', content: userQuery };
    setChatHistory(prev => [...prev, newChatEntry]);
    
    try {
      const res = await axios.get('http://localhost:5001/api/sql/generate', {
        params: { userQuery: userQuery }
      });
      
      const sqlResponse = res.data.sql_query.replace(/```sql|```/g, '').trim();
      
      const botChatEntry = { type: 'bot', content: sqlResponse };
      setChatHistory(prev => [...prev, botChatEntry]);
      
      setToastMessage('SQL generated successfully!');
      setShowToast(true);
    } catch (error) {
      console.error(error);
      const errorChatEntry = { type: 'bot', content: 'Error generating SQL. Please try again.' };
      setChatHistory(prev => [...prev, errorChatEntry]);
      
      setToastMessage('Error generating SQL!');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  // Execute SQL query
  const executeQuery = async () => {
    if (!editorQuery.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5001/api/sql/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: editorQuery,
          dbType: dbType,
          ...dbConfig[dbType]
        }),
      });

      const result = await response.json();
      if (result.success) {
        setQueryResult(result.data);
        setToastMessage('Query executed successfully!');
        setShowToast(true);
      } else {
        throw new Error(result.message || 'Failed to execute query');
      }
    } catch (error) {
      console.error(error);
      setToastMessage(`Error: ${error.message}`);
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (content) => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setToastMessage('Copied to clipboard!');
    setShowToast(true);
  };

  // Render database connection form based on selected type
  const renderDbConnectionForm = () => {
    const config = dbConfig[dbType];
    
    switch (dbType) {
      case 'mysql':
        return (
          <>
            <Form.Group className="mb-3">
              <Form.Label>Host</Form.Label>
              <Form.Control
                type="text"
                value={config.host}
                onChange={(e) => handleDbConfigChange('host', e.target.value)}
                placeholder="localhost"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Port</Form.Label>
              <Form.Control
                type="text"
                value={config.port}
                onChange={(e) => handleDbConfigChange('port', e.target.value)}
                placeholder="3306"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                value={config.user}
                onChange={(e) => handleDbConfigChange('user', e.target.value)}
                placeholder="root"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={config.password}
                onChange={(e) => handleDbConfigChange('password', e.target.value)}
                placeholder="password"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Database Name</Form.Label>
              <Form.Control
                type="text"
                value={config.database}
                onChange={(e) => handleDbConfigChange('database', e.target.value)}
                placeholder="database_name"
              />
            </Form.Group>
          </>
        );
      
      case 'postgres':
        return (
          <>
            <Form.Group className="mb-3">
              <Form.Label>Host</Form.Label>
              <Form.Control
                type="text"
                value={config.host}
                onChange={(e) => handleDbConfigChange('host', e.target.value)}
                placeholder="localhost"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Port</Form.Label>
              <Form.Control
                type="text"
                value={config.port}
                onChange={(e) => handleDbConfigChange('port', e.target.value)}
                placeholder="5432"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                value={config.user}
                onChange={(e) => handleDbConfigChange('user', e.target.value)}
                placeholder="postgres"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={config.password}
                onChange={(e) => handleDbConfigChange('password', e.target.value)}
                placeholder="password"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Database Name</Form.Label>
              <Form.Control
                type="text"
                value={config.database}
                onChange={(e) => handleDbConfigChange('database', e.target.value)}
                placeholder="database_name"
              />
            </Form.Group>
          </>
        );
      
      case 'spark':
        return (
          <>
            <Form.Group className="mb-3">
              <Form.Label>Host</Form.Label>
              <Form.Control
                type="text"
                value={config.host}
                onChange={(e) => handleDbConfigChange('host', e.target.value)}
                placeholder="localhost"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Port</Form.Label>
              <Form.Control
                type="text"
                value={config.port}
                onChange={(e) => handleDbConfigChange('port', e.target.value)}
                placeholder="10000"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                value={config.username}
                onChange={(e) => handleDbConfigChange('username', e.target.value)}
                placeholder="spark_user"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password (Optional)</Form.Label>
              <Form.Control
                type="password"
                value={config.password}
                onChange={(e) => handleDbConfigChange('password', e.target.value)}
                placeholder="password"
              />
            </Form.Group>
          </>
        );

      case 'trio':
        return (
          <>
            <Form.Group className="mb-3">
              <Form.Label>Host</Form.Label>
              <Form.Control
                type="text"
                value={config.host}
                onChange={(e) => handleDbConfigChange('host', e.target.value)}
                placeholder="localhost"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Port</Form.Label>
              <Form.Control
                type="text"
                value={config.port}
                onChange={(e) => handleDbConfigChange('port', e.target.value)}
                placeholder="8080"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                value={config.username}
                onChange={(e) => handleDbConfigChange('username', e.target.value)}
                placeholder="trio_user"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={config.password}
                onChange={(e) => handleDbConfigChange('password', e.target.value)}
                placeholder="password"
              />
            </Form.Group>
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <Container fluid className="vh-100 p-0 overflow-hidden">
      {/* Custom CSS styles */}
      <style>{`
        .ghost-mode-toggle {
          position: absolute;
          right: 15px;
          top: 15px;
          z-index: 100;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #ddd;
          transition: all 0.3s ease;
        }
        
        .ghost-mode-toggle:hover {
          background: rgba(255, 255, 255, 0.9);
          transform: scale(1.1);
        }
        
        .ghost-mode-toggle.active {
          background: rgba(108, 117, 125, 0.8);
          color: white;
        }
        
        .ghost-suggestion-panel {
          position: absolute;
          right: 0;
          top: 0;
          width: 350px;
          height: 100%;
          background: white;
          z-index: 90;
          box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
          padding: 15px;
          overflow-y: auto;
          transition: transform 0.3s ease;
        }

        .chat-container {
          display: flex;
          height: calc(100vh - 72px);
          position: relative;
          width: 100%;
        }

        .left-panel {
          width: ${leftPanelWidth};
          height: 100%;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          min-width: 250px;
          max-width: 60%;
        }

        .right-panel {
          flex: 1;
          height: 100%;
          min-width: 40%;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .divider {
          width: 6px;
          height: 100%;
          background-color: #f0f0f0;
          cursor: col-resize;
          position: relative;
          z-index: 10;
        }

        .divider:hover {
          background-color: #d0d0d0;
        }

        .divider::after {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          left: 1px;
          right: 1px;
          background-color: #ccc;
        }

        .chat-message {
          margin-bottom: 12px;
          padding: 10px 14px;
          border-radius: 12px;
          max-width: 85%;
          word-wrap: break-word;
          font-size: 0.9rem;
        }

        .user-message {
          align-self: flex-end;
          background-color: #e3f2fd;
          margin-left: auto;
          border-bottom-right-radius: 2px;
        }

        .bot-message {
          align-self: flex-start;
          background-color: #f5f5f5;
          margin-right: auto;
          border-bottom-left-radius: 2px;
        }

        .chat-history {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
        }

        .query-results {
          max-height: 300px;
          overflow-y: auto;
          font-size: 0.85rem;
        }

        .editor-container {
          flex: 1;
          min-height: 300px;
        }

        .navbar-content {
          max-width: 100%;
          overflow-x: auto;
        }

        pre {
          white-space: pre-wrap;
          word-break: break-word;
          font-size: 0.85rem;
          margin-bottom: 0.5rem;
        }

        .form-control {
          font-size: 0.9rem;
        }

        .btn {
          font-size: 0.9rem;
        }
      `}</style>
      
      <Navbar bg="dark" variant="dark" className="p-3">
        <Container fluid className="navbar-content">
          <Navbar.Brand className="fs-4 fw-bold">SQL Assistant</Navbar.Brand>
          <div className="d-flex gap-2 align-items-center">
            <Button
              variant="outline-light"
              onClick={toggleGhostMode}
              active={ghostMode}
              className="d-flex align-items-center"
              size="sm"
            >
              <Magic className="me-1" size={14} />
              Ghost Mode
            </Button>
            <Button
              onClick={() => navigate('/SchemaGenerator')}
              disabled={loading}
              variant="outline-light"
              size="sm"
            >
              Schema Recommendation
            </Button>
            <Button
              variant={connectionStatus ? 'primary' : 'success'}
              onClick={() => setShowModal(true)}
              disabled={loading}
              className="d-flex align-items-center"
              size="sm"
            >
              <Database className="me-1" size={14} />
              {connectionStatus || 'Connect DB'}
            </Button>
          </div>
        </Container>
      </Navbar>

      <div className="chat-container" ref={containerRef}>
        {/* Left Panel - Chat Assistant */}
        <div className="left-panel">
          <Card className="flex-grow-1 shadow-sm h-100">
            <Card.Header className="bg-white p-2">
              <h5 className="m-0 fs-5">SQL Chat Assistant</h5>
            </Card.Header>
            <Card.Body className="d-flex flex-column p-0 h-100">
              <div className="chat-history">
                {chatHistory.length === 0 ? (
                  <div className="text-muted text-center py-5">
                    Start a conversation by entering your query
                  </div>
                ) : (
                  chatHistory.map((item, index) => (
                    <div 
                      key={index} 
                      className={`chat-message ${item.type === 'user' ? 'user-message' : 'bot-message'}`}
                    >
                      <strong className="d-block mb-1">{item.type === 'user' ? 'You:' : 'Assistant:'}</strong>
                      <div>
                        {item.type === 'bot' ? (
                          <>
                            <pre>{item.content}</pre>
                            <Button 
                              size="sm" 
                              variant="outline-primary"
                              onClick={() => copyToClipboard(item.content)}
                              className="mt-1"
                            >
                              <Copy size={12} className="me-1" /> Copy SQL
                            </Button>
                          </>
                        ) : (
                          item.content
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <Form.Group className="p-2 border-top">
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  placeholder="Describe the SQL query you need..."
                  disabled={loading}
                  className="fs-6"
                />
                <Button 
                  className="mt-2 w-100" 
                  onClick={generateSQL} 
                  disabled={loading || !userQuery.trim()}
                  size="sm"
                >
                  {loading ? <Spinner animation="border" size="sm" className="me-2" /> : 'Generate SQL'}
                </Button>
              </Form.Group>
            </Card.Body>
          </Card>
        </div>

        {/* Resizable Divider */}
        <div 
          className="divider"
          ref={dividerRef}
          onMouseDown={handleDividerMouseDown}
        />

        {/* Right Panel - Editor and Results */}
        <div className="right-panel">
          <div className="d-flex flex-column h-100 position-relative">
            {/* Ghost Mode Toggle Button */}
            <div 
              className={`ghost-mode-toggle ${ghostMode ? 'active' : ''}`}
              onClick={toggleGhostMode}
              title={ghostMode ? 'Disable Ghost Mode' : 'Enable Ghost Mode'}
            >
              {ghostMode ? <Eye size={16} /> : <EyeSlash size={16} />}
            </div>
            
            {/* Ghost Suggestion Panel */}
            {showGhostSuggestion && (
              <div className="ghost-suggestion-panel">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5>Ghost Suggestion</h5>
                  <Button 
                    variant="outline-secondary"
                    size="sm" 
                    onClick={() => setShowGhostSuggestion(false)}
                  >
                    Close
                  </Button>
                </div>
                
                {isGeneratingGhostSuggestion ? (
                  <div className="text-center py-3">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2">Generating SQL suggestion...</p>
                  </div>
                ) : (
                  <>
                    <pre className="p-3 bg-light rounded" style={{ whiteSpace: 'pre-wrap' }}>
                      {ghostSuggestion}
                    </pre>
                    <div className="d-flex justify-content-between mt-3">
                      <Button 
                        variant="outline-secondary"
                        onClick={() => {
                          copyToClipboard(ghostSuggestion);
                          setShowGhostSuggestion(false);
                        }}
                      >
                        <Copy className="me-2" /> Copy Only
                      </Button>
                      <Button 
                        variant="primary" 
                        onClick={() => {
                          applyGhostSuggestion();
                          setShowGhostSuggestion(false);
                        }}
                      >
                        Apply to Editor
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
            
            <Card className="flex-grow-1 mb-2 shadow-sm">
              <Card.Header className="bg-white p-2 d-flex justify-content-between align-items-center">
                <h5 className="m-0 fs-5">SQL Editor</h5>
                {ghostMode && (
                  <span className="text-success" style={{ fontSize: '0.8rem' }}>
                    Ghost Mode Active
                  </span>
                )}
              </Card.Header>
              <Card.Body className="p-0 editor-container">
                <Editor
                  height="100%"
                  defaultLanguage="sql"
                  value={editorQuery}
                  onChange={setEditorQuery}
                  defaultValue="-- Write your SQL query here\n-- Press Enter in Ghost Mode to generate from comments"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    wordWrap: 'on',
                    scrollBeyondLastLine: false
                  }}
                  onMount={handleEditorDidMount}
                />
              </Card.Body>
              <Card.Footer className="bg-white p-2">
                <Button 
                  className="w-100" 
                  onClick={executeQuery} 
                  disabled={loading || !editorQuery.trim()}
                  size="sm"
                >
                  {loading ? <Spinner animation="border" size="sm" className="me-2" /> : 'Execute Query'}
                </Button>
              </Card.Footer>
            </Card>

            <Card className="shadow-sm">
              <Card.Header className="bg-white p-2">
                <h5 className="m-0 fs-5">Query Results</h5>
              </Card.Header>
              <Card.Body className="query-results p-2">
                {queryResult ? (
                  queryResult.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table table-bordered table-sm">
                        <thead>
                          <tr>
                            {Object.keys(queryResult[0]).map((key) => (
                              <th key={key}>{key}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {queryResult.map((row, index) => (
                            <tr key={index}>
                              {Object.values(row).map((value, idx) => (
                                <td key={idx}>{String(value)}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-muted">Query executed successfully but returned no data</div>
                  )
                ) : (
                  <div className="text-muted">Results will appear here after query execution</div>
                )}
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>

      {/* Database Connection Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Database Connection</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Database Type</Form.Label>
              <Dropdown>
                <Dropdown.Toggle variant="outline-secondary" className="w-100">
                  {dbType.toUpperCase()}
                </Dropdown.Toggle>
                <Dropdown.Menu className="w-100">
                  <Dropdown.Item onClick={() => setDbType('mysql')}>MySQL</Dropdown.Item>
                  <Dropdown.Item onClick={() => setDbType('postgres')}>PostgreSQL</Dropdown.Item>
                  <Dropdown.Item onClick={() => setDbType('spark')}>Spark SQL</Dropdown.Item>
                  <Dropdown.Item onClick={() => setDbType('trio')}>Trio</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Form.Group>
            
            {renderDbConnectionForm()}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConnectDatabase}>
            Connect
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Toast Notifications */}
      <Toast 
        show={showToast} 
        onClose={() => setShowToast(false)} 
        delay={3000} 
        autohide
        style={{ position: 'fixed', bottom: '20px', right: '20px' }}
      >
        <Toast.Body>{toastMessage}</Toast.Body>
      </Toast>
    </Container>
  );
};

export default SQLAssistant;