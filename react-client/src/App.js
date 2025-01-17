import React, { useState } from 'react';
import axios from 'axios';
import FileList from './FileList';
import ProjectList from './ProjectList';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

const FileUpload = () => {

  return (
     <Router>
      <Routes>
        <Route path="/" element={<ProjectList />} />
        <Route path="/files/:projectId" element={<FileList />} />
      </Routes>
    </Router>
    
  );
};

export default FileUpload;
