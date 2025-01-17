console.log("storyline-functions.js loaded");

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
async function sendCompletionData(learnerId, courseId, status) {
  try {
    console.log('Sending completion data...');
    const result = await makeRequest('https://scorm-api.vercel.app/api/completion', 'POST', {
      learnerId: learnerId,
      courseId: courseId,
      completionStatus: status
    });
    console.log('Completion data sent successfully:', result);
    return result;
  } catch (error) {
    console.error('Error sending completion data:', error);
    throw error;
  }
}

// Function to retrieve completion data
async function getCompletionData(learnerId, courseId) {
  try {
    console.log('Retrieving completion data...');
    const result = await makeRequest(
      `https://scorm-api.vercel.app/api/completion?learnerId=${encodeURIComponent(learnerId)}&courseId=${encodeURIComponent(courseId)}`,
      'GET'
    );
    
    // Set the Storyline variable
    var player = GetPlayer();
    if (player && typeof player.SetVar === 'function') {
      player.SetVar('CompletionStatus', result.completionStatus);
      console.log('Storyline variable set:', result.completionStatus);
    } else {
      console.warn('Storyline player or SetVar function not available');
    }
    
    return result;
  } catch (error) {
    console.error('Error retrieving completion data:', error);
    throw error;
  }
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

