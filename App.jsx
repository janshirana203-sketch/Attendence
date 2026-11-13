import { useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, ArrowUpRight, Bell, BookOpen, CalendarDays,
  Check, CheckCircle2, ChevronDown, ClipboardCheck, Clock3, Download,
  GraduationCap, LayoutDashboard, Menu, Search, Settings, ShieldCheck,
  UserPlus, Users, X, XCircle
} from 'lucide-react';

const programs = [
  { name: 'B.Tech CSE', prefix: 'CS' },
  { name: 'B.Tech IT', prefix: 'IT' },
  { name: 'BCA', prefix: 'BC' },
];
const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const sections = ['A', 'B'];
const names = [
  'Aarav Sharma', 'Ananya Gupta', 'Vihaan Patel', 'Diya Singh',
  'Arjun Verma', 'Ishita Rana', 'Kabir Mehta', 'Sara Khan',
  'Reyansh Joshi', 'Myra Kapoor', 'Aditya Nair', 'Aisha Khan',
  'Rohan Das', 'Meera Iyer', 'Dev Malhotra', 'Kavya Joshi',
  'Ishaan Roy', 'Saanvi Rao', 'Neil Kapoor', 'Tara Menon',
  'Yash Shah', 'Kiara Bose', 'Dhruv Sethi', 'Nisha Reddy',
];
const colors = ['violet', 'blue', 'peach', 'mint', 'pink'];
const todayISO = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const dateISO = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const initials = name => name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase();
const load = (key, fallback) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (error) {
    console.error(`Unable to load ${key} from local storage.`, error);
    return fallback;
  }
};

function createDemoStudents() {
  return programs.flatMap((program, programIndex) =>
    years.flatMap((year, yearIndex) =>
      sections.flatMap(section =>
        Array.from({ length: 6 }, (_, index) => {
          const roll = `${program.prefix}${yearIndex + 1}${section}${String(index + 1).padStart(2, '0')}`;
          return {
            id: roll,
            name: names[(programIndex * 8 + yearIndex * 3 + (section === 'B' ? 6 : 0) + index) % names.length],
            roll,
            course: program.name,
            year,
            section,
          };
        }),
      ),
    ),
  );
}

function createDemoAttendance(students) {
  const records = {};
  const day = new Date();
  let weekdays = 0;
  let index = 0;
  while (weekdays < 15) {
    day.setDate(day.getDate() - 1);
    if (day.getDay() === 0 || day.getDay() === 6) continue;
    const date = dateISO(day);
    records[date] = Object.fromEntries(students.map((student, studentIndex) => {
      const absent = studentIndex % 5 === 0 ? index % 3 === 0 : (studentIndex * 3 + index * 7) % 17 === 0;
      return [student.id, absent ? 'Absent' : 'Present'];
    }));
    weekdays += 1;
    index += 1;
  }
  return records;
}

function App() {
  const [students, setStudents] = useState(() => {
    const stored = load('attendease_students', null);
    return stored
      ? stored.map(student => ({ ...student, year: student.year || '2nd Year', section: student.section || 'A' }))
      : createDemoStudents();
  });
  const [attendance, setAttendance] = useState(() => {
    const stored = load('attendease_attendance', null);
    return stored || createDemoAttendance(createDemoStudents());
  });
  const [date, setDate] = useState(todayISO());
  const [program, setProgram] = useState('B.Tech CSE');
  const [year, setYear] = useState('2nd Year');
  const [section, setSection] = useState('A');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('All students');
  const [showForm, setShowForm] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRoll, setNewRoll] = useState('');
  const [newCourse, setNewCourse] = useState(program);
  const [newYear, setNewYear] = useState(year);
  const [newSection, setNewSection] = useState(section);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('attendease_students', JSON.stringify(students));
    } catch (error) {
      console.error('Unable to save student register.', error);
      setNotice('Could not save students. Check available browser storage.');
    }
  }, [students]);
  useEffect(() => {
    try {
      localStorage.setItem('attendease_attendance', JSON.stringify(attendance));
    } catch (error) {
      console.error('Unable to save attendance records.', error);
      setNotice('Could not save attendance. Check available browser storage.');
    }
  }, [attendance]);

  const classStudents = useMemo(
    () => students.filter(student => student.course === program && student.year === year && student.section === section),
    [students, program, year, section],
  );
  const dayRecords = attendance[date] || {};
  const presentCount = classStudents.filter(student => dayRecords[student.id] === 'Present').length;
  const absentCount = classStudents.filter(student => dayRecords[student.id] === 'Absent').length;
  const unmarkedCount = classStudents.length - presentCount - absentCount;
  const rate = classStudents.length ? Math.round((presentCount / classStudents.length) * 100) : 0;
  const historyDays = Object.keys(attendance).sort();
  const attendancePercent = student => {
    const markedDays = historyDays.filter(day => attendance[day]?.[student.id]);
    if (!markedDays.length) return null;
    const presentDays = markedDays.filter(day => attendance[day][student.id] === 'Present').length;
    return Math.round((presentDays / markedDays.length) * 100);
  };
  const lowAttendance = classStudents.filter(student => {
    const percent = attendancePercent(student);
    return percent !== null && percent < 75;
  });

  const filteredStudents = useMemo(() => classStudents.filter(student => {
    const matchesQuery = `${student.name} ${student.roll} ${student.course}`.toLowerCase().includes(query.toLowerCase());
    const status = dayRecords[student.id] || 'Not marked';
    const matchesFilter = filter === 'All students'
      || (filter === 'Present' && status === 'Present')
      || (filter === 'Absent' && status === 'Absent')
      || (filter === 'Not marked' && status === 'Not marked');
    return matchesQuery && matchesFilter;
  }), [classStudents, dayRecords, query, filter]);

  const notify = message => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2500);
  };
  const mark = (studentId, status) => {
    setAttendance(previous => ({
      ...previous,
      [date]: { ...(previous[date] || {}), [studentId]: status },
    }));
    notify(`Attendance marked ${status.toLowerCase()}.`);
  };
  const markAll = status => {
    setAttendance(previous => ({
      ...previous,
      [date]: { ...(previous[date] || {}), ...Object.fromEntries(classStudents.map(student => [student.id, status])) },
    }));
    notify(`${classStudents.length} students marked ${status.toLowerCase()} for ${program}, ${year}, Section ${section}.`);
  };
  const resetDay = () => {
    setAttendance(previous => {
      const day = { ...(previous[date] || {}) };
      classStudents.forEach(student => delete day[student.id]);
      const next = { ...previous };
      if (Object.keys(day).length) next[date] = day;
      else delete next[date];
      return next;
    });
    notify(`Attendance reset for ${program}, ${year}, Section ${section}.`);
  };
  const addStudent = event => {
    event.preventDefault();
    const roll = newRoll.trim().toUpperCase();
    if (!newName.trim() || !roll) {
      notify('Enter a student name and roll number.');
      return;
    }
    if (students.some(student => student.roll.toLowerCase() === roll.toLowerCase())) {
      notify('That roll number already exists.');
      return;
    }
    setStudents(previous => [...previous, {
      id: roll,
      name: newName.trim(),
      roll,
      course: newCourse,
      year: newYear,
      section: newSection,
    }]);
    setProgram(newCourse);
    setYear(newYear);
    setSection(newSection);
    setNewName('');
    setNewRoll('');
    setShowForm(false);
    notify('Student added to the class register.');
  };
  const exportCsv = () => {
    const rows = [
      ['Date', 'Program', 'Year', 'Section', 'Roll number', 'Student', 'Status', 'Attendance %'],
      ...classStudents.map(student => [
        date,
        program,
        year,
        section,
        student.roll,
        student.name,
        dayRecords[student.id] || 'Not marked',
        attendancePercent(student) === null ? 'No history' : `${attendancePercent(student)}%`,
      ]),
    ];
    const csv = rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-${program.replaceAll(' ', '-')}-${year.replaceAll(' ', '-')}-${section}-${date}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    notify('Attendance report downloaded.');
  };
  const openAddStudent = () => {
    setNewCourse(program);
    setNewYear(year);
    setNewSection(section);
    setShowForm(true);
  };
  const prettyDate = new Date(`${date}T12:00:00`).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <div className="app-shell">
      {mobileNav && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileNav(false)} />}
      <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><GraduationCap size={23} strokeWidth={2.5} /></div>
          <div><strong>AttendEase</strong><span>COLLEGE PORTAL</span></div>
          <button className="close-nav" onClick={() => setMobileNav(false)} aria-label="Close menu"><X size={19} /></button>
        </div>
        <div className="nav-label">WORKSPACE</div>
        <nav className="navigation">
          <a className="nav-item active" href="#dashboard" onClick={() => setMobileNav(false)}><LayoutDashboard size={18} /><span>Dashboard</span><span className="active-dot" /></a>
          <a className="nav-item" href="#attendance" onClick={() => setMobileNav(false)}><ClipboardCheck size={18} /><span>Attendance</span></a>
          <a className="nav-item" href="#students" onClick={() => setMobileNav(false)}><Users size={18} /><span>Students</span></a>
          <a className="nav-item" href="#reports" onClick={() => setMobileNav(false)}><Activity size={18} /><span>Reports</span><span className="nav-tag">CSV</span></a>
        </nav>
        <div className="nav-label tools-label">PREFERENCES</div>
        <nav className="navigation">
          <a className="nav-item" href="#class-filters" onClick={() => setMobileNav(false)}><Settings size={18} /><span>Class settings</span></a>
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon"><ShieldCheck size={19} /></div>
            <strong>Local demo workspace</strong>
            <p>Data is saved in this browser only. Connect a backend before using with real student records.</p>
          </div>
          <div className="profile">
            <div className="profile-avatar">AD</div>
            <div className="profile-copy"><strong>Admin User</strong><span>College administrator</span></div>
            <ChevronDown size={16} className="profile-chevron" />
          </div>
        </div>
      </aside>

      <main className="main-content" id="dashboard">
        <header className="topbar">
          <div className="topbar-left">
            <button className="menu-button" aria-label="Open menu" onClick={() => setMobileNav(true)}><Menu size={22} /></button>
            <div className="breadcrumb">Academic workspace <span>/</span> <strong>Attendance</strong></div>
          </div>
          <div className="topbar-right">
            <div className="today-chip"><span className="live-dot" />{prettyDate}</div>
            <button className="icon-button notification" aria-label="Notifications"><Bell size={18} /><i /></button>
            <div className="top-avatar">AD</div>
          </div>
        </header>

        <div className="page-content">
          <section className="welcome-row">
            <div>
              <div className="eyebrow"><span /> COLLEGE ATTENDANCE MANAGEMENT</div>
              <h1>Attendance dashboard <span className="wave">✦</span></h1>
              <p className="page-subtitle">Monitor class attendance, manage your student register, and follow up on low attendance.</p>
            </div>
            <button className="primary-button" onClick={openAddStudent}><UserPlus size={17} /> Add student</button>
          </section>

          <section className="class-filter-panel" id="class-filters" aria-label="Class selection">
            <div className="class-filter-heading"><div className="class-filter-icon"><GraduationCap size={18} /></div><div><strong>Class selection</strong><span>Choose the cohort you want to manage</span></div></div>
            <div className="class-filter-controls">
              <label><span>PROGRAM</span><select value={program} onChange={event => setProgram(event.target.value)}>{programs.map(item => <option key={item.name}>{item.name}</option>)}</select></label>
              <label><span>ACADEMIC YEAR</span><select value={year} onChange={event => setYear(event.target.value)}>{years.map(item => <option key={item}>{item}</option>)}</select></label>
              <label><span>SECTION</span><select value={section} onChange={event => setSection(event.target.value)}>{sections.map(item => <option key={item}>{item}</option>)}</select></label>
              <div className="selected-class"><span>SELECTED CLASS</span><strong>{program} · {year} · Section {section}</strong></div>
            </div>
          </section>

          <section className="summary-grid" aria-label="Attendance summary">
            <article className="summary-card total-card">
              <div className="card-top"><span className="metric-icon purple"><Users size={19} /></span><span className="metric-caption">CLASS STRENGTH</span></div>
              <div className="metric-value">{classStudents.length}<span className="metric-unit"> students</span></div>
              <div className="metric-bottom"><span className="tiny-badge neutral"><Users size={12} /> Enrolled</span><span className="metric-foot">{year} · Section {section}</span></div>
              <div className="card-decoration decoration-purple" /><div className="card-decoration decoration-purple second" />
            </article>
            <article className="summary-card present-card">
              <div className="card-top"><span className="metric-icon green"><CheckCircle2 size={19} /></span><span className="metric-caption">PRESENT TODAY</span></div>
              <div className="metric-value">{presentCount}<span className="metric-unit"> students</span></div>
              <div className="metric-bottom"><span className="tiny-badge positive"><ArrowUpRight size={12} /> {classStudents.length ? Math.round(presentCount / classStudents.length * 100) : 0}%</span><span className="metric-foot">Of selected class</span></div>
              <div className="card-decoration decoration-green" />
            </article>
            <article className="summary-card absent-card">
              <div className="card-top"><span className="metric-icon red"><XCircle size={19} /></span><span className="metric-caption">ABSENT TODAY</span></div>
              <div className="metric-value">{absentCount}<span className="metric-unit"> students</span></div>
              <div className="metric-bottom"><span className="tiny-badge negative">{classStudents.length ? Math.round(absentCount / classStudents.length * 100) : 0}%</span><span className="metric-foot">Of selected class</span></div>
              <div className="card-decoration decoration-red" />
            </article>
            <article className="summary-card rate-card">
              <div className="card-top"><span className="metric-icon orange"><Activity size={19} /></span><span className="metric-caption">TODAY'S ATTENDANCE</span></div>
              <div className="metric-value">{rate}<span className="metric-unit">%</span></div>
              <div className="progress-track"><div className="progress-fill" style={{ width: `${rate}%` }} /></div>
              <div className="metric-bottom"><span className="metric-foot">{unmarkedCount} not yet marked</span><span className="metric-foot">Target: 90%</span></div>
            </article>
          </section>

          <section className="attendance-panel" id="attendance">
            <div className="panel-heading">
              <div>
                <div className="section-kicker"><span className="kicker-line" /> DAILY REGISTER</div>
                <h2>{program} · {year} · Section {section}</h2>
                <p className="panel-subtitle">Mark and review student attendance for the selected date.</p>
              </div>
              <div className="panel-actions">
                <label className="date-picker"><CalendarDays size={16} /><input type="date" max={todayISO()} value={date} onChange={event => setDate(event.target.value)} aria-label="Select attendance date" /></label>
                <button className="outline-button" onClick={exportCsv}><Download size={15} /> Export CSV</button>
                <button className="outline-button" onClick={() => markAll('Present')} disabled={!classStudents.length}><Check size={15} /> Mark all present</button>
              </div>
            </div>

            <div className="table-toolbar">
              <div className="table-title"><BookOpen size={17} /><strong>Student register</strong><span className="count-pill">{filteredStudents.length}</span></div>
              <div className="table-controls">
                <label className="search-box"><Search size={16} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search name or roll no..." aria-label="Search students" />{query && <button onClick={() => setQuery('')} aria-label="Clear search"><X size={14} /></button>}</label>
                <label className="filter-select"><span className="sr-only">Filter attendance</span><select value={filter} onChange={event => setFilter(event.target.value)}><option>All students</option><option>Present</option><option>Absent</option><option>Not marked</option></select><ChevronDown size={14} /></label>
              </div>
            </div>

            <div className="table-wrap" id="students">
              <table>
                <thead><tr><th>STUDENT</th><th>ROLL NUMBER</th><th>PROGRAM</th><th>ATTENDANCE</th><th>STATUS · {date === todayISO() ? 'TODAY' : prettyDate.toUpperCase()}</th><th className="action-heading">MARK</th></tr></thead>
                <tbody>
                  {filteredStudents.map((student, index) => {
                    const status = dayRecords[student.id] || 'Not marked';
                    const percent = attendancePercent(student);
                    return <tr key={student.id}>
                      <td><div className="student-cell"><div className={`student-avatar ${colors[index % colors.length]}`}>{initials(student.name)}</div><div className="student-name-wrap"><strong>{student.name}</strong><span>{student.year} · Section {student.section}</span></div></div></td>
                      <td><span className="roll-number">{student.roll}</span></td>
                      <td><span className="course-name">{student.course}</span></td>
                      <td><div className={`attendance-percent ${percent !== null && percent < 75 ? 'attendance-low' : ''}`}><span>{percent === null ? '—' : `${percent}%`}</span><small>{percent === null ? 'No history' : 'Overall'}</small></div></td>
                      <td><span className={`status-badge ${status === 'Present' ? 'status-present' : status === 'Absent' ? 'status-absent' : 'status-pending'}`}><i />{status}</span></td>
                      <td><div className="attendance-actions"><button className={`mark-button mark-yes ${status === 'Present' ? 'selected' : ''}`} onClick={() => mark(student.id, 'Present')} aria-label={`Mark ${student.name} present`} title="Mark present"><Check size={15} /></button><button className={`mark-button mark-no ${status === 'Absent' ? 'selected' : ''}`} onClick={() => mark(student.id, 'Absent')} aria-label={`Mark ${student.name} absent`} title="Mark absent"><X size={15} /></button></div></td>
                    </tr>;
                  })}
                  {filteredStudents.length === 0 && <tr><td colSpan="6" className="empty-state"><Search size={22} /><strong>{classStudents.length ? 'No students found' : 'No students in this class yet'}</strong><span>{classStudents.length ? 'Try another search or attendance filter.' : 'Add students to start taking attendance.'}</span></td></tr>}
                </tbody>
              </table>
            </div>
            <div className="table-footer"><span>Showing <strong>{filteredStudents.length}</strong> of <strong>{classStudents.length}</strong> students in this class</span><span className="footer-note"><Clock3 size={14} /> Changes save automatically</span></div>
          </section>

          <section className="bottom-grid" id="reports">
            <article className={`insight-card ${lowAttendance.length ? 'low-attendance-card' : ''}`}>
              <div className="insight-icon">{lowAttendance.length ? <AlertTriangle size={18} /> : <Activity size={18} />}</div>
              <div className="insight-copy"><h3>{lowAttendance.length ? 'Low attendance follow-up' : 'Class attendance insight'}</h3><p>{lowAttendance.length ? `${lowAttendance.length} student${lowAttendance.length === 1 ? '' : 's'} below 75% overall attendance. Review the register and follow up.` : `${presentCount} present, ${absentCount} absent, and ${unmarkedCount} yet to be marked for ${prettyDate}.`}</p></div>
              <div className="insight-rate">{lowAttendance.length}<span>below 75%</span></div>
            </article>
            <article className="quick-card">
              <div className="quick-icon"><ClipboardCheck size={19} /></div><div><strong>Class actions</strong><p>Export a report or reset this class for the selected date.</p></div>
              <button onClick={resetDay} className="text-button">Reset day <ArrowUpRight size={14} /></button>
            </article>
          </section>
          <footer className="page-footer"><span>© 2026 AttendEase · College attendance workspace</span><span>Demo data is stored in this browser</span></footer>
        </div>
      </main>

      {showForm && <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setShowForm(false); }}>
        <form className="student-modal" onSubmit={addStudent}>
          <div className="modal-header"><div className="modal-icon"><UserPlus size={20} /></div><button type="button" className="modal-close" onClick={() => setShowForm(false)} aria-label="Close"><X size={18} /></button></div>
          <h2>Add a student</h2><p className="modal-subtitle">Create a student record in a program, year, and section.</p>
          <label className="form-label">Full name<input required value={newName} onChange={event => setNewName(event.target.value)} placeholder="e.g. Priya Sharma" autoFocus /></label>
          <label className="form-label">Roll number<input required value={newRoll} onChange={event => setNewRoll(event.target.value)} placeholder="e.g. CS2A07" /></label>
          <label className="form-label">Program<select value={newCourse} onChange={event => setNewCourse(event.target.value)}>{programs.map(item => <option key={item.name}>{item.name}</option>)}</select></label>
          <div className="form-row">
            <label className="form-label">Academic year<select value={newYear} onChange={event => setNewYear(event.target.value)}>{years.map(item => <option key={item}>{item}</option>)}</select></label>
            <label className="form-label">Section<select value={newSection} onChange={event => setNewSection(event.target.value)}>{sections.map(item => <option key={item}>{item}</option>)}</select></label>
          </div>
          <div className="modal-actions"><button type="button" className="cancel-button" onClick={() => setShowForm(false)}>Cancel</button><button type="submit" className="primary-button">Add student <ArrowUpRight size={15} /></button></div>
        </form>
      </div>}
      {notice && <div className="toast"><CheckCircle2 size={17} />{notice}</div>}
    </div>
  );
}

export default App;
