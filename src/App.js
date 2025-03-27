import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SQLAssistant from './components/SQLGenerator';


import SchemaGenerator from "./components/SchemaGenerator";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SQLAssistant />} />
        <Route path="/SchemaGenerator" element={<SchemaGenerator />} />
        <Route path="/connect-database" element={<SQLAssistant />} />
      </Routes>
    </Router>
  );
};

export default App;
