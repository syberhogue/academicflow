import React from 'react';
import { AlertCircle, ArrowLeft, BookOpen, Check, Clock, FileText, Plus, Search, Users, X } from 'lucide-react';
import { PROGRAM_TYPES } from '../data';
import { Badge, Card, ProgressBar } from '../ui';

export function ProgramDetailView(props) {
  const {
    selectedProgram,
    activeTab,
    setActiveTab,
    setActiveView,
    setSelectedProgramId,
    removeCourse,
    setElectiveModalSlot,
    electiveModalSlot,
    placeholderCredits,
    setPlaceholderCredits: updatePlaceholderCredits,
    setCourseSearchTerm,
    courseSearchTerm,
    globalCourses,
    insertCourse,
    handleCloseModal,
    moveCourse
  } = props;
    if (!selectedProgram) return null;

    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <button 
              onClick={() => { setActiveView('dashboard'); setSelectedProgramId(null); }}
              className="flex items-center gap-2 text-sm text-slate-500 hover:text-indigo-600 mb-3 font-medium transition-colors"
            >
              <ArrowLeft size={16} /> Back to Programs
            </button>
            <h1 className="text-3xl font-bold text-slate-900 mb-1">{selectedProgram.name}</h1>
            <p className="text-slate-500 font-medium">{selectedProgram.type} • {selectedProgram.faculty} • Lead: {selectedProgram.lead}</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge type={selectedProgram.status === 'Drafting' ? 'draft' : selectedProgram.status === 'In Review' ? 'warning' : 'success'}>
              {selectedProgram.status}
            </Badge>
            <button className="px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm font-medium transition-colors shadow-sm">
              Export PDF
            </button>
          </div>
        </div>

        <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', icon: FileText, label: 'Overview & Milestones' },
            { id: 'map', icon: BookOpen, label: 'Curriculum Map' },
            { id: 'reviews', icon: AlertCircle, label: 'Feedback & Reviews' },
            { id: 'faculty', icon: Users, label: 'Assigned Faculty' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab.id 
                  ? 'border-indigo-600 text-indigo-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        <div className="pt-4">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Program Description</h3>
                  <p className="text-slate-700 leading-relaxed">{selectedProgram.description}</p>
                </Card>

                <Card className="p-0 overflow-hidden">
                  <div className="p-6 border-b border-slate-200 bg-slate-50">
                    <h3 className="text-lg font-bold text-slate-900">Approval Milestones</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                      {selectedProgram.milestones.map((milestone, idx) => (
                        <div key={milestone.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                          <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${milestone.completed ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                            {milestone.completed ? <Check size={16} strokeWidth={3} /> : <Clock size={16} />}
                          </div>
                          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-900">{milestone.name}</span>
                              {milestone.date ? (
                                <span className="text-xs font-medium text-slate-500 mt-1">{new Date(milestone.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              ) : (
                                <span className="text-xs font-medium text-slate-400 mt-1">Pending</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4">Quick Stats</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Total Semesters</span>
                      <span className="font-bold text-slate-900">{selectedProgram.semesters.length}</span>
                    </div>
                    <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                      <span className="text-slate-500 font-medium">Defined Courses</span>
                      <span className="font-bold text-slate-900">{selectedProgram.semesters.reduce((acc, sem) => acc + sem.courses.length, 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Faculty Involved</span>
                      <span className="font-bold text-slate-900">{selectedProgram.facultyMembers.length}</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'map' && (() => {
            const typeDef = PROGRAM_TYPES.find(pt => pt.name === selectedProgram.type) || PROGRAM_TYPES[1]; 
            const targetCredits = typeDef.minCredits;
            
            const currentCredits = selectedProgram.semesters.reduce((acc, sem) => 
              acc + sem.courses.reduce((cAcc, c) => cAcc + (c && c.credits !== undefined ? Number(c.credits) : 0), 0)
            , 0);
            
            const targetCourses = Math.ceil(targetCredits / 3);
            const currentCourses = selectedProgram.semesters.reduce((acc, sem) => acc + sem.courses.filter(c => c).length, 0);
            
            const creditProgress = targetCredits > 0 ? Math.min(100, Math.round((currentCredits / targetCredits) * 100)) : 0;
            const courseProgress = targetCourses > 0 ? Math.min(100, Math.round((currentCourses / targetCourses) * 100)) : 0;

            return (
              <div className="space-y-6 relative">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                   <div>
                     <h2 className="text-lg font-bold text-slate-900 mb-1">Curriculum Map</h2>
                     <p className="text-sm font-medium text-slate-500">Maximum 6 courses per term. Drag and drop to reorganize.</p>
                   </div>
                   <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto">
                      <div className="flex-1 w-full sm:w-48">
                         <div className="flex justify-between text-xs font-bold uppercase tracking-wide text-slate-700 mb-2">
                            <span>Total Credits</span>
                            <span className={currentCredits >= targetCredits ? 'text-emerald-600' : ''}>{currentCredits} / {targetCredits}</span>
                         </div>
                         <ProgressBar percentage={creditProgress} height="h-2" color={currentCredits >= targetCredits ? 'bg-emerald-500' : 'bg-indigo-500'} />
                      </div>
                      <div className="flex-1 w-full sm:w-48">
                         <div className="flex justify-between text-xs font-bold uppercase tracking-wide text-slate-700 mb-2">
                            <span>Total Courses</span>
                            <span className={currentCourses >= targetCourses ? 'text-emerald-600' : ''}>{currentCourses} / {targetCourses}</span>
                         </div>
                         <ProgressBar percentage={courseProgress} height="h-2" color={currentCourses >= targetCourses ? 'bg-emerald-500' : 'bg-indigo-500'} />
                      </div>
                   </div>
                </div>
                
                <div className="flex flex-col border border-slate-200 bg-slate-200 gap-[1px] rounded-xl overflow-hidden shadow-sm">
                  {selectedProgram.semesters.map((sem) => (
                    <div key={sem.id} className="flex flex-col md:flex-row bg-white">
                      <div className="w-full md:w-40 flex-shrink-0 p-4 bg-slate-50 flex items-center border-b md:border-b-0 md:border-r border-slate-200">
                        <span className="font-bold text-sm text-slate-700 uppercase tracking-wide">{sem.name}</span>
                      </div>
                      <div className="flex-1 p-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                        {Array.from({ length: 6 }).map((_, i) => {
                          const course = sem.courses[i];
                          return (
                            <div 
                              key={`${sem.id}_${i}`}
                              className={`h-24 rounded-lg relative transition-all ${course ? `${course.color || 'bg-slate-200'} shadow-sm` : 'bg-slate-50 border border-dashed border-slate-300'}`}
                              onDragOver={(e) => { e.preventDefault(); }}
                              onDrop={(e) => {
                                e.preventDefault();
                                try {
                                  const data = JSON.parse(e.dataTransfer.getData('application/json'));
                                  if (data.type === 'course') {
                                     const sourceSemId = data.semesterId;
                                     const sourceIndex = data.courseIndex;
                                     
                                     if(sourceSemId === sem.id && sourceIndex === i) return;

                                     moveCourse(selectedProgram.id, sourceSemId, sourceIndex, sem.id, i);
                                  }
                                } catch (err) {
                                  console.error("Failed to parse drag data", err);
                                }
                              }}
                            >
                              {course ? (
                                <div
                                  draggable
                                  onDragStart={(e) => {
                                    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'course', semesterId: sem.id, courseIndex: i }));
                                  }}
                                  className="w-full h-full flex flex-col items-center justify-center cursor-grab active:cursor-grabbing relative group"
                                >
                                  <button
                                     onClick={(e) => { e.stopPropagation(); removeCourse(selectedProgram.id, sem.id, course.code); }}
                                     className="absolute top-1 right-1 p-1 text-black/40 hover:text-black hover:bg-white/50 rounded transition-all opacity-0 group-hover:opacity-100"
                                     title="Remove course"
                                  >
                                    <X size={14} />
                                  </button>
                                  <div className="absolute top-1.5 left-1.5 text-[10px] font-bold text-black/50 bg-white/40 px-1.5 py-0.5 rounded shadow-sm">
                                      {course.credits !== undefined ? course.credits : 3}cr
                                  </div>
                                  <div className="text-xs font-bold text-slate-900 mb-0.5 mt-3">{course.code}</div>
                                  <div className="text-[10px] leading-tight text-slate-800 text-center px-2 line-clamp-3 font-medium">{course.title}</div>
                                </div>
                              ) : (
                                <div 
                                  onClick={() => {
                                    updatePlaceholderCredits(3);
                                    setElectiveModalSlot({ semesterId: sem.id, index: i, termName: sem.name });
                                  }}
                                  className="w-full h-full hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors rounded-lg cursor-pointer flex items-center justify-center group"
                                  title="Add course or placeholder"
                                >
                                  <Plus size={20} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Elective/Course Modal */}
                {electiveModalSlot && (
                  <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg">Add to Map</h3>
                          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{electiveModalSlot.termName} • Slot {electiveModalSlot.index + 1}</p>
                        </div>
                        <button onClick={handleCloseModal} className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
                          <X size={20} />
                        </button>
                      </div>
                      
                      <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                        
                        {/* Search Catalog */}
                        <div className="space-y-3">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">Search & Select Course</label>
                          <div className="flex items-center border border-slate-300 rounded-lg bg-white focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 overflow-hidden">
                            <div className="pl-3 text-slate-400"><Search size={16} /></div>
                            <input
                              type="text"
                              autoFocus
                              placeholder="Type course code or title..."
                              className="w-full px-3 py-2.5 outline-none text-sm font-medium"
                              value={courseSearchTerm}
                              onChange={(e) => setCourseSearchTerm(e.target.value)}
                            />
                          </div>

                          <div className="border border-slate-200 rounded-lg max-h-48 overflow-y-auto bg-white shadow-inner">
                            {(() => {
                              const filteredCourses = courseSearchTerm.trim() === '' 
                                ? globalCourses 
                                : globalCourses.filter(c => 
                                    c.code.toLowerCase().includes(courseSearchTerm.toLowerCase()) || 
                                    c.title.toLowerCase().includes(courseSearchTerm.toLowerCase())
                                  );

                              return filteredCourses.length > 0 ? (
                                filteredCourses.map(c => (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() => {
                                      insertCourse(selectedProgram.id, electiveModalSlot.semesterId, electiveModalSlot.index, { 
                                        code: c.code, 
                                        title: c.title, 
                                        color: c.color,
                                        credits: c.credits !== undefined ? c.credits : 3 
                                      });
                                      handleCloseModal();
                                    }}
                                    className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b last:border-0 border-slate-100 flex justify-between items-center group transition-colors"
                                  >
                                    <div className="min-w-0 pr-2">
                                      <div className="font-bold text-slate-900 text-sm truncate">{c.code}</div>
                                      <div className="text-xs text-slate-500 truncate">{c.title}</div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Badge type="neutral">{c.credits}cr</Badge>
                                        <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Plus size={14} />
                                        </div>
                                    </div>
                                  </button>
                                ))
                              ) : (
                                <div className="p-4 text-sm text-slate-500 text-center">No courses match "{courseSearchTerm}"</div>
                              );
                            })()}
                          </div>
                        </div>

                        <div className="relative">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                          </div>
                          <div className="relative flex justify-center text-sm">
                            <span className="px-3 bg-white text-xs font-bold text-slate-400 uppercase tracking-wide">OR ADD PLACEHOLDER</span>
                          </div>
                        </div>

                        {/* Special Blocks */}
                        <div className="space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200 shadow-sm">
                          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                             <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Placeholder Credits</label>
                             <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                                <button onClick={() => updatePlaceholderCredits(Math.max(0, placeholderCredits - 1))} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded font-bold text-lg transition-colors">-</button>
                                <span className="text-sm font-bold w-6 text-center">{placeholderCredits}</span>
                                <button onClick={() => updatePlaceholderCredits(placeholderCredits + 1)} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded font-bold text-lg transition-colors">+</button>
                             </div>
                          </div>

                          <div className="space-y-2">
                            <button 
                              onClick={() => {
                                insertCourse(selectedProgram.id, electiveModalSlot.semesterId, electiveModalSlot.index, { code: 'EXP', title: 'Experiential', color: 'bg-emerald-200', credits: placeholderCredits });
                                handleCloseModal();
                              }}
                              className="w-full text-left px-4 py-3 rounded-lg bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all font-medium flex items-center justify-between shadow-sm hover:shadow"
                            >
                              <div className="flex items-center gap-3">
                                  <div className="w-4 h-4 rounded-sm bg-emerald-200 border border-emerald-300" />
                                  <span className="text-sm text-slate-700">Experiential Learning</span>
                              </div>
                              <Badge type="neutral">{placeholderCredits}cr</Badge>
                            </button>

                            <button 
                              onClick={() => {
                                insertCourse(selectedProgram.id, electiveModalSlot.semesterId, electiveModalSlot.index, { code: 'ELEC', title: 'General Elective', color: 'bg-slate-200', credits: placeholderCredits });
                                handleCloseModal();
                              }}
                              className="w-full text-left px-4 py-3 rounded-lg bg-white border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all font-medium flex items-center justify-between shadow-sm hover:shadow"
                            >
                              <div className="flex items-center gap-3">
                                  <div className="w-4 h-4 rounded-sm bg-slate-200 border border-slate-300" />
                                  <span className="text-sm text-slate-700">General Elective</span>
                              </div>
                              <Badge type="neutral">{placeholderCredits}cr</Badge>
                            </button>

                            <button 
                              onClick={() => {
                                insertCourse(selectedProgram.id, electiveModalSlot.semesterId, electiveModalSlot.index, { code: 'OPEN', title: 'Open Elective', color: 'bg-slate-300', credits: placeholderCredits });
                                handleCloseModal();
                              }}
                              className="w-full text-left px-4 py-3 rounded-lg bg-white border border-slate-200 hover:border-slate-400 hover:bg-slate-50 transition-all font-medium flex items-center justify-between shadow-sm hover:shadow"
                            >
                              <div className="flex items-center gap-3">
                                  <div className="w-4 h-4 rounded-sm bg-slate-300 border border-slate-400" />
                                  <span className="text-sm text-slate-700">Open Elective</span>
                              </div>
                              <Badge type="neutral">{placeholderCredits}cr</Badge>
                            </button>
                          </div>

                          <form 
                            onSubmit={(e) => {
                              e.preventDefault();
                              const type = new FormData(e.target).get('electiveType');
                              if (type) {
                                insertCourse(selectedProgram.id, electiveModalSlot.semesterId, electiveModalSlot.index, { code: 'ELEC', title: `${type} Elective`, color: 'bg-indigo-200', credits: placeholderCredits });
                                handleCloseModal();
                              }
                            }}
                            className="pt-4 border-t border-slate-200"
                          >
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 block">Custom Elective Type</label>
                            <div className="flex gap-2">
                              <input name="electiveType" placeholder="e.g. Technical, Business..." className="flex-1 px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white font-medium shadow-sm" />
                              <button type="submit" className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors shadow-sm">
                                Create
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            );
          })()}

          {activeTab === 'reviews' && (
            <div className="space-y-4">
              {selectedProgram.reviews.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <AlertCircle className="mx-auto mb-3 text-slate-400" size={32} />
                  <p>No reviews or feedback yet.</p>
                </div>
              ) : (
                selectedProgram.reviews.map(review => (
                  <Card key={review.id} className="p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                    <div>
                      <div className="flex gap-2 items-center mb-1">
                        <Badge type={review.status === 'open' ? 'warning' : 'success'}>
                          {review.status}
                        </Badge>
                        <span className="text-sm font-bold text-slate-900">{review.category} Review</span>
                        <span className="text-sm text-slate-500">• {review.reviewer}</span>
                      </div>
                      <p className="text-slate-700">{review.text}</p>
                    </div>
                    {review.status === 'open' && (
                      <button className="px-4 py-2 border border-slate-300 rounded text-sm font-medium hover:bg-slate-50">
                        Mark Resolved
                      </button>
                    )}
                  </Card>
                ))
              )}
            </div>
          )}

          {activeTab === 'faculty' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedProgram.facultyMembers.map(faculty => (
                <Card key={faculty.id} className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <Users size={20} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{faculty.name}</div>
                    <div className="text-sm text-slate-500">{faculty.role}</div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
}
