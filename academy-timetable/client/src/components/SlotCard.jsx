import { deriveSlotStatus } from "../utils/slotStatus";
import { getTeacherHighlightStyle } from "../utils/teacherColor";

const SlotCard = ({ slot, muted = false, useStoredStatus = false, showOverlapBadge = false }) => {
  const status = useStoredStatus ? slot.status : deriveSlotStatus(slot);
  const teacherColor = slot.teacher?.color;

  return (
    <div className={`slot-card ${muted ? "slot-card--muted" : ""}`}>
      <div className="slot-card__line slot-card__time">
        {slot.startTime} – {slot.endTime}
      </div>

      {slot.slotType === "test" ? (
        <div className="slot-card__line slot-card__test">
          TEST · {slot.subject || "—"} · Ch. {slot.chapterNumber || "—"}
        </div>
      ) : (
        <div
          className="slot-card__line slot-card__teacher"
          style={getTeacherHighlightStyle(teacherColor)}
        >
          <span className="mr-1">{slot.teacher?.name || "—"}</span>
          {showOverlapBadge && slot.teacher?.allowScheduleOverlap ? (
            <span className="slot-card__teacher-overlap">Overlap</span>
          ) : null}
        </div>
      )}

      {slot.topic ? <div className="slot-card__line slot-card__topic">{slot.topic}</div> : null}

      {status && status !== "scheduled" ? (
        <div className="slot-card__status">{status}</div>
      ) : null}
    </div>
  );
};

export default SlotCard;
