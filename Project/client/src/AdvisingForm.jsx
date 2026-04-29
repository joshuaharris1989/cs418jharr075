import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";

const API = import.meta.env.VITE_API_KEY;

function AdvisingForm() {
  const navigate = useNavigate();
  const { id } = useParams();

  const savedUser = localStorage.getItem("loggedInUser");
  const user = savedUser ? JSON.parse(savedUser) : null;

  const [lastTerm, setLastTerm] = useState("");
  const [lastGpa, setLastGpa] = useState("");
  const [currentTerm, setCurrentTerm] = useState("");
  const [status, setStatus] = useState("pending");
  const [msg, setMsg] = useState("");
  const [locked, setLocked] = useState(false);

  const [courses, setCourses] = useState([{ level: "", name: "" }]);
  const [completedCourses, setCompletedCourses] = useState([]);

  const levelOptions = ["100", "200", "300", "400", "500"];

  const courseOptions = [
    "CS121G",
    "CS150",
    "CS170",
    "CS250",
    "CS252",
    "CS261",
    "CS330",
    "CS350",
    "CS361",
    "CS381",
    "CS390",
    "CS410",
    "CS418",
    "CS450",
    "CS471",
    "CS480",
    "Course Unlisted"
  ];

  useEffect(() => {
    async function loadAdvisingRecord() {
      if (!id || id === "new") {
        return;
      }

      try {
        const res = await fetch(API + "/advising/" + id);
        const data = await res.json();

        if (!res.ok) {
          setMsg(data.error || "Could not load record");
          return;
        }

        if (data.advising) {
          setLastTerm(data.advising.last_term || "");
          setLastGpa(data.advising.last_gpa || "");
          setCurrentTerm(data.advising.current_term || "");
          setStatus(data.advising.status || "pending");

          if (
            data.advising.status === "approved" ||
            data.advising.status === "rejected"
          ) {
            setLocked(true);
          }

          if (data.items && data.items.length > 0) {
            const loadedCourses = data.items.map((item) => {
              return {
                level: item.course_level || "",
                name: item.course_name || ""
              };
            });

            setCourses(loadedCourses);
          }
        }
      } catch (err) {
        setMsg("Server error");
      }
    }

    loadAdvisingRecord();
  }, [id]);

  useEffect(() => {
    async function loadCompletedCourses() {
      if (!user || !user.u_id || lastTerm.trim() === "") {
        setCompletedCourses([]);
        return;
      }

      try {
        const res = await fetch(
          API +
            "/advising/completed/" +
            user.u_id +
            "/" +
            encodeURIComponent(lastTerm)
        );

        const data = await res.json();

        if (!res.ok) {
          setCompletedCourses([]);
          return;
        }

        const names = [];
        for (let i = 0; i < data.length; i++) {
          names.push((data[i].course_name || "").toLowerCase().trim());
        }

        setCompletedCourses(names);
      } catch (err) {
        setCompletedCourses([]);
      }
    }

    loadCompletedCourses();
  }, [lastTerm, user]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  function addRow() {
    if (locked) return;
    setCourses([...courses, { level: "", name: "" }]);
  }

  function removeRow(index) {
    if (locked) return;
    if (courses.length === 1) return;

    const updatedCourses = [...courses];
    updatedCourses.splice(index, 1);
    setCourses(updatedCourses);
  }

  function handleCourseChange(index, field, value) {
    if (locked) return;

    const updatedCourses = [...courses];
    updatedCourses[index][field] = value;
    setCourses(updatedCourses);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");

    if (
      lastTerm.trim() === "" ||
      lastGpa.trim() === "" ||
      currentTerm.trim() === ""
    ) {
      setMsg("Please fill in all of the history fields.");
      return;
    }

    const cleanedCourses = [];
    for (let i = 0; i < courses.length; i++) {
      if (courses[i].level.trim() !== "" && courses[i].name.trim() !== "") {
        cleanedCourses.push(courses[i]);
      }
    }

    if (cleanedCourses.length === 0) {
      setMsg("Please add at least one course.");
      return;
    }

    for (let i = 0; i < cleanedCourses.length; i++) {
      const currentCourseName = cleanedCourses[i].name.toLowerCase().trim();

      for (let j = 0; j < completedCourses.length; j++) {
        if (currentCourseName === completedCourses[j]) {
          setMsg("You already took " + cleanedCourses[i].name + " last term.");
          return;
        }
      }
    }

    const payload = {
      user_id: user.u_id,
      last_term: lastTerm,
      last_gpa: lastGpa,
      current_term: currentTerm,
      courses: cleanedCourses
    };

    let url = API + "/advising";
    let method = "POST";

    if (id && id !== "new") {
      url = API + "/advising/" + id;
      method = "PUT";
    }

    try {
      const res = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setMsg(data.error || "Could not save record");
        return;
      }

      navigate("/advising");
    } catch (err) {
      setMsg("Server error");
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: 20 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20
        }}
      >
        <h2>
          {id && id !== "new"
            ? "Course Advising Record"
            : "New Course Advising Form"}
        </h2>
        <button type="button"onClick={() => navigate("/advising")}>Back to List</button>
      </div>

      <form onSubmit={handleSubmit}>
        <div
          style={{
            padding: 16,
            border: "1px solid #ddd",
            borderRadius: 10,
            marginBottom: 20
          }}
        >
          <h3>History</h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "180px 1fr",
              rowGap: 10
            }}
          >
            <label>Last Term</label>
            <input
              value={lastTerm}
              onChange={(e) => setLastTerm(e.target.value)}
              disabled={locked}
            />

            <label>Last GPA</label>
            <input
              value={lastGpa}
              onChange={(e) => setLastGpa(e.target.value)}
              disabled={locked}
            />

            <label>Current Term</label>
            <input
              value={currentTerm}
              onChange={(e) => setCurrentTerm(e.target.value)}
              disabled={locked}
            />

            <label>Status</label>
            <span style={{ textTransform: "capitalize" }}>{status}</span>
          </div>
        </div>

        <div
          style={{
            padding: 16,
            border: "1px solid #ddd",
            borderRadius: 10
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16
            }}
          >
            <h3>Course Plan</h3>
            {!locked && (
              <button type="button" onClick={addRow}>
                Add Row
              </button>
            )}
          </div>

          {courses.map((course, index) => {
            let alreadyTaken = false;

            if (course.name.trim() !== "") {
              for (let i = 0; i < completedCourses.length; i++) {
                if (course.name.toLowerCase().trim() === completedCourses[i]) {
                  alreadyTaken = true;
                  break;
                }
              }
            }

            return (
              <div
                key={index}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr auto",
                  gap: 10,
                  marginBottom: 10
                }}
              >
                <select
                  value={course.level}
                  onChange={(e) =>
                    handleCourseChange(index, "level", e.target.value)
                  }
                  disabled={locked}
                >
                  <option value="">Select Level</option>
                  {levelOptions.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>

                <select
                  value={course.name}
                  onChange={(e) =>
                    handleCourseChange(index, "name", e.target.value)
                  }
                  disabled={locked}
                  style={{
                    border: alreadyTaken ? "2px solid red" : ""
                  }}
                >
                  <option value="">Select Course</option>
                  {courseOptions.map((courseName) => (
                    <option key={courseName} value={courseName}>
                      {courseName}
                    </option>
                  ))}
                </select>

                {!locked && (
                  <button type="button" onClick={() => removeRow(index)}>
                    Remove
                  </button>
                )}
              </div>
            );
          })}

          {!locked && (
            <button type="submit" style={{ marginTop: 10 }}>
              {id && id !== "new" ? "Save Changes" : "Submit"}
            </button>
          )}
        </div>

        {msg && (
          <p style={{ color: "red", marginTop: 12 }}>
            {msg}
          </p>
        )}
      </form>
    </div>
  );
}

export default AdvisingForm;