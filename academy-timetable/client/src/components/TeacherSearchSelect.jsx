import { useMemo, useState } from "react";

const TeacherSearchSelect = ({
  teachers = [],
  value,
  onChange,
  placeholder = "Search teacher...",
  className = "",
  allowEmpty = true,
  emptyLabel = "All teachers",
  compact = false
}) => {
  const [search, setSearch] = useState("");

  const selectedTeacher = teachers.find((teacher) => teacher._id === value);

  const filteredTeachers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return teachers;
    return teachers.filter((teacher) => {
      const name = (teacher.name || "").toLowerCase();
      const subject = (teacher.subject || "").toLowerCase();
      return name.includes(query) || subject.includes(query);
    });
  }, [teachers, search]);

  return (
    <div className={className}>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={placeholder}
        className="form-input"
      />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="form-select mt-2"
        size={compact ? undefined : Math.min(Math.max(filteredTeachers.length + (allowEmpty ? 1 : 0), 3), 8)}
      >
        {allowEmpty && <option value="">{emptyLabel}</option>}
        {filteredTeachers.map((teacher) => (
          <option key={teacher._id} value={teacher._id}>
            {teacher.name}
            {teacher.subject ? ` (${teacher.subject})` : ""}
          </option>
        ))}
      </select>
      {selectedTeacher && !compact && (
        <p className="mt-1 text-xs text-slate-500">
          Selected: {selectedTeacher.name}
          {selectedTeacher.subject ? ` · ${selectedTeacher.subject}` : ""}
        </p>
      )}
      {search.trim() && filteredTeachers.length === 0 && (
        <p className="mt-1 text-xs text-amber-700">No teachers match your search.</p>
      )}
    </div>
  );
};

export default TeacherSearchSelect;
