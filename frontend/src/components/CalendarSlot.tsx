type Props = {
  start: string;
  end: string;
};

const CalendarSlot = ({ start, end }: Props) => {
  const startDate = new Date(start);
  const endDate = new Date(end);

  const label = `${startDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })} - ${endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

  return (
    <div className="text-xs px-2 py-1 rounded-md bg-indigo-600/20 border border-indigo-500/40 text-indigo-100">
      {label}
    </div>
  );
};

export default CalendarSlot;


