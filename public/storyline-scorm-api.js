(function(window) {
    // Utility function to handle API calls
    function makeRequest(url, method, data) {
      console.log(`Making ${method} request to ${url}`);
      return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.open(method, url, true);
        
        xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
        
        xhr.onreadystatechange = function() {
          console.log(`XHR state changed: readyState=${xhr.readyState}, status=${xhr.status}`);
          if (xhr.readyState === 4) {
            if (xhr.status === 200) {
              try {
                var response = JSON.parse(xhr.responseText);
                console.log('Received response:', response);
                resolve(response);
              } catch (e) {
                console.error('Error parsing JSON response:', e);
                reject(new Error('Invalid JSON response'));
              }
            } else {
              console.error(`Request failed with status ${xhr.status}`);
              reject(new Error('Request failed with status ' + xhr.status));
            }
          }
        };
        
        xhr.onerror = function() {
          console.error('Network error occurred');
          reject(new Error('Network error'));
        };
        
        if (data) {
          console.log('Sending data:', data);
          xhr.send(JSON.stringify(data));
        } else {
          xhr.send();
        }
      });
    }
  
    // Function to send completion data
    function sendCompletionData(learnerId, courseId, status) {
      console.log('Sending completion data...', { learnerId, courseId, status });
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
      console.log('Retrieving completion data...', { learnerId, courseId });
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
      console.log('Attempting to get student ID');
      try {
        if (typeof GetStudentID === 'function') {
          console.log('Using GetStudentID function');
          return GetStudentID();
        } else if (typeof player !== 'undefined' && typeof player.GetVar === 'function') {
          console.log('Using player.GetVar function');
          return player.GetVar("StudentID");
        } else if (typeof pipwerks !== 'undefined' && pipwerks.SCORM) {
          console.log('Using pipwerks SCORM');
          var scorm = pipwerks.SCORM;
          if (scorm.version) {
            return scorm.get('cmi.core.student_id') || scorm.get('cmi.learner_id') || '';
          }
        }
      } catch (e) {
        console.error('Error getting student ID:', e);
      }
      console.log('Falling back to generated ID');
      return 'UNKNOWN_' + Math.random().toString(36).substr(2, 9);
    }
  
    function SCORM_SetComplete() {
      console.log('Attempting to set completion status');
      try {
        if (typeof SetScore === 'function') {
          console.log('Using SetScore function');
          return SetScore(100, 100, 100);
        } else if (typeof player !== 'undefined' && typeof player.SetVar === 'function') {
          console.log('Using player.SetVar function');
          player.SetVar("cmi.core.lesson_status", "completed");
          return true;
        } else if (typeof pipwerks !== 'undefined' && pipwerks.SCORM) {
          console.log('Using pipwerks SCORM');
          var scorm = pipwerks.SCORM;
          if (scorm.version) {
            return scorm.set('cmi.core.lesson_status', 'completed') || 
                   scorm.set('cmi.completion_status', 'completed');
          }
        }
      } catch (e) {
        console.error('Error setting completion status:', e);
      }
      console.log('Failed to set completion status');
      return false;
    