import SearchableComboBox from "./SearchableComboBox";

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
  return (
    <SearchableComboBox
      className={className}
      options={Array.isArray(teachers) ? teachers : []}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      emptyLabel={emptyLabel}
      allowEmpty={allowEmpty}
      compact={compact}
      inputClassName="form-input"
      mode="value"
      getOptionLabel={(teacher) => `${teacher.name}${teacher.subject ? ` (${teacher.subject})` : ""}`}
      getOptionValue={(teacher) => teacher._id}
      helperText={!compact && value ? `Selected teacher updates across timetable, tests, and progress pages.` : ""}
    />
  );
};

export default TeacherSearchSelect;
