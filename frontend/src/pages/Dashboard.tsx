const Dashboard = () => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Dashboard</h2>
      <p className="text-slate-300 text-sm">
        Quick overview of commissioner engagement operations. Use the navigation to manage engagements, availability, and reports.
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        {['Engagements', 'Availability', 'Reports'].map((item) => (
          <div key={item} className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <p className="font-semibold">{item}</p>
            <p className="text-xs text-slate-400">View and manage {item.toLowerCase()}.</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;

