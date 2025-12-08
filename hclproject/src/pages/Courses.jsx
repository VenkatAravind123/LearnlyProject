import React, { useMemo } from "react";

const sampleCourses = [
  { id: "react", title: "React Basics", level: "Beginner", duration: "3h" },
  { id: "js", title: "JavaScript Essentials", level: "Beginner", duration: "4h" },
  { id: "alg", title: "Algorithms Intro", level: "Intermediate", duration: "5h" },
  { id: "ds", title: "Data Structures", level: "Intermediate", duration: "6h" },
];

function CourseCard({ c }) {
  return (
    <article className="course-card">
      <div className="course-meta">
        <div className="course-title">{c.title}</div>
        <div className="muted small">{c.level} • {c.duration}</div>
      </div>
      <div className="course-actions">
        <button>Start</button>
        <button className="ghost">Preview</button>
      </div>
    </article>
  );
}

export default function Courses({ search }) {
  const filtered = useMemo(() => {
    const q = (search || "").trim().toLowerCase();
    if (!q) return sampleCourses;
    return sampleCourses.filter(
      (c) => c.title.toLowerCase().includes(q) || c.level.toLowerCase().includes(q)
    );
  }, [search]);

  return (
    <section>
      <div className="section-header">
        <h3>All Courses</h3>
        <p className="muted">Browse and start learning at your own pace.</p>
      </div>

      <div className="courses-grid">
        {filtered.map((c) => (
          <CourseCard key={c.id} c={c} />
        ))}
        {filtered.length === 0 && <div className="muted">No courses match your search.</div>}
      </div>
    </section>
  );
}