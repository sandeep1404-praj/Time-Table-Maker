import { formatDisplayDate, getWeekdayName } from "../utils/dateFormat";

const DateCell = ({ date, onDelete, showDelete = false }) => {
  const weekday = getWeekdayName(date);
  const displayDate = formatDisplayDate(date);

  return (
    <div className="date-cell">
      <div className="date-cell__content">
        <span className="date-cell__weekday">{weekday}</span>
        <span className="date-cell__date">{displayDate}</span>
      </div>
      {showDelete && onDelete ? (
        <button
          type="button"
          onClick={onDelete}
          className="date-cell__delete"
          title="Delete Row"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" />
            <path d="M19 6l-2 14H7L5 6" />
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      ) : null}
    </div>
  );
};

export default DateCell;
