(function(window) {
    // Utility function to handle API calls
    function makeRequest(url, method, data) {
      return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.open(method, url, true);
        
        if (method === 'POST') {
          xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
        }
        
        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4) {
            if (xhr.status === 200) {
              try {
                resolve(JSON.parse(xhr.responseText));
              } catch (e) {
                reject(new Error('Invalid JSON response'));
              }
            } else {
              reject(new Error('Request failed'));
            }
          }
        };
        
        xhr.onerror = function() {
          reject(new Error('Network error'));
        };
        
        if (data) {
          xhr.send(JSON.stringify(data));
        } else {
          xhr.send();
        }
      });
    }
    
    // Function to send completion data
    function sendCompletionData(learnerId, courseId, status) {
      console.log('Sending completion data...');
      return makeRequest('https://scorm-api.vercel.app/api/completion', 'POST', {
        learnerId: learnerId,
        courseId: courseId,
        completionStatus: status
      }).then(function(result) {
        console.log('Completion data sent successfully:', result);
        return result;
      }).catch(function(error) {
        console.error('Error sending completion data:', error);
        throw error;
      });
    }
    
    // Function to retrieve completion data
    function getCompletionData(learnerId, courseId) {
      console.log('Retrieving completion data...');
      return makeRequest(
        `https://scorm-api.vercel.app/api/completion?learnerId=${encodeURIComponent(learnerId)}&courseId=${encodeURIComponent(courseId)}`,
        'GET'
      ).then(function(result) {
        console.log('Completion data retrieved:', result);
        return result;
      }).catch(function(error) {
        console.error('Error retrieving completion data:', error);
        throw error;
      });
    }
    
    // SCORM utility functions
    function SCORM_GetStudentID() {
      try {
        var scorm = pipwerks.SCORM;
        if (scorm.version) {
          return scorm.get('cmi.core.student_id') || scorm.get('cmi.learner_id') || '';
        }
      } catch (e) {
        console.error('Error getting student ID:', e);
      }
      return '';
    }
    
    function SCORM_SetComplete() {
      try {
        var scorm = pipwerks.SCORM;
        if (scorm.version) {
          return scorm.set('cmi.core.lesson_status', 'completed') || 
                 scorm.set('cmi.completion_status', 'completed');
        }
      } catch (e) {
        console.error('Error setting completion status:', e);
      }
      return false;
    }
  
    // Make functions globally accessible
    window.sendCompletionData = sendCompletionData;
    window.getCompletionData = getCompletionData;
    window.SCORM_GetStudentID = SCORM_GetStudentID;
    window.SCORM_SetComplete = SCORM_SetComplete;
  
  })(window);
  