;((window) => {
    // Utility function to handle API calls
    function makeRequest(url, method, data) {
      return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest()
        xhr.open(method, url, true)
  
        if (method === "POST") {
          xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8")
        }
  
        xhr.onreadystatechange = () => {
          if (xhr.readyState === 4) {
            if (xhr.status === 200) {
              try {
                resolve(JSON.parse(xhr.responseText))
              } catch (e) {
                reject(new Error("Invalid JSON response"))
              }
            } else {
              reject(new Error("Request failed"))
            }
          }
        }
  
        xhr.onerror = () => {
          reject(new Error("Network error"))
        }
  
        if (data) {
          xhr.send(JSON.stringify(data))
        } else {
          xhr.send()
        }
      })
    }
  
    // Function to send completion data
    function sendCompletionData(learnerId, courseId, status) {
      console.log("Sending completion data...")
      return makeRequest("https://scorm-api.vercel.app/api/completion", "POST", {
        learnerId: learnerId,
        courseId: courseId,
        completionStatus: status,
      })
        .then((result) => {
          console.log("Completion data sent successfully:", result)
          return result
        })
        .catch((error) => {
          console.error("Error sending completion data:", error)
          throw error
        })
    }
  
    // Function to retrieve completion data
    function getCompletionData(learnerId, courseId) {
      console.log("Retrieving completion data...")
      return makeRequest(
        `https://scorm-api.vercel.app/api/completion?learnerId=${encodeURIComponent(learnerId)}&courseId=${encodeURIComponent(courseId)}`,
        "GET",
      )
        .then((result) => {
          console.log("Completion data retrieved:", result)
          return result
        })
        .catch((error) => {
          console.error("Error retrieving completion data:", error)
          throw error
        })
    }
  
    // SCORM utility functions
    function SCORM_GetStudentID() {
      try {
        if (typeof pipwerks !== "undefined" && pipwerks.SCORM) {
          var scorm = pipwerks.SCORM
          if (scorm.version) {
            return scorm.get("cmi.core.student_id") || scorm.get("cmi.learner_id") || ""
          }
        } else if (typeof GetStudentID === "function") {
          // Fallback to Storyline's built-in GetStudentID function
          return GetStudentID()
        }
      } catch (e) {
        console.error("Error getting student ID:", e)
      }
      // If all else fails, return a placeholder or generate a random ID
      return "UNKNOWN_" + Math.random().toString(36).substr(2, 9)
    }
  
    function SCORM_SetComplete() {
      try {
        if (typeof pipwerks !== "undefined" && pipwerks.SCORM) {
          var scorm = pipwerks.SCORM
          if (scorm.version) {
            return scorm.set("cmi.core.lesson_status", "completed") || scorm.set("cmi.completion_status", "completed")
          }
        } else if (typeof SetScore === "function") {
          // Fallback to Storyline's built-in SetScore function
          return SetScore(100, 100, 100)
        }
      } catch (e) {
        console.error("Error setting completion status:", e)
      }
      return false
    }
  
    // Make functions globally accessible
    window.sendCompletionData = sendCompletionData
    window.getCompletionData = getCompletionData
    window.SCORM_GetStudentID = SCORM_GetStudentID
    window.SCORM_SetComplete = SCORM_SetComplete
  })(window)
  
  