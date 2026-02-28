import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Archive,
  Star,
  List,
  Clock,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TodoSection } from './TodoSection';
import { SectionMenu } from './SectionMenu';
import { TodoItem } from './TodoItem';
import { format, subDays, addDays, isToday } from 'date-fns';
import { useTodoStore, type TodoView, type DaySnapshotItem } from '../../stores/todoStore';

export function TodoWorkspace() {
  const {
    sections,
    history,
    lastView,
    isLoaded,
    load,
    setLastView,
    addSection,
    updateSectionTitle,
    archiveSection,
    deleteSection,
    reorderSections,
    moveSection,
    addTodo,
    addTodoBelow,
    toggleTodoCompleted,
    updateTodo,
    deleteTodo,
    toggleDaily,
    getHistoryForDate,
  } = useTodoStore();

  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [historyDate, setHistoryDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!isLoaded) load();
  }, [isLoaded, load]);

  const view = lastView;

  const handleViewChange = (v: TodoView) => {
    setLastView(v);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewSectionTitle(val);
    if (val.startsWith('/')) {
      setIsSearching(true);
      setSearchQuery(val.slice(1));
    } else {
      setIsSearching(false);
      setSearchQuery('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newSectionTitle.trim() && !isSearching) {
      addSection(newSectionTitle.trim());
      setNewSectionTitle('');
    }
    if (e.key === 'Escape') {
      setNewSectionTitle('');
      setIsSearching(false);
      setSearchQuery('');
    }
  };

  const scrollToSection = (sectionId: string) => {
    handleViewChange('all');
    setTimeout(() => {
      const el = document.getElementById(`section-${sectionId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const activeIds = activeSections.map((s) => s.id);
    const oldIndex = activeIds.indexOf(active.id as string);
    const newIndex = activeIds.indexOf(over.id as string);
    reorderSections(oldIndex, newIndex);
  };

  const activeSections = sections.filter((s) => !s.archived);
  const archivedSections = sections.filter((s) => s.archived);
  const archivedCount = archivedSections.length;

  const dailyBySection = sections
    .map((s) => ({
      id: s.id,
      title: s.title,
      todos: s.todos.filter((t) => t.daily),
    }))
    .filter((g) => g.todos.length > 0);

  const dailyCount = dailyBySection.reduce((sum, g) => sum + g.todos.length, 0);

  const historyKey = format(historyDate, 'yyyy-MM-dd');
  const daySnapshot = getHistoryForDate(historyKey);

  const tabClass = (isActive: boolean) =>
    `flex items-center gap-1.5 px-2.5 py-1 text-xs rounded transition-colors ${
      isActive
        ? 'bg-(--note-bg) text-(--note-text) shadow-sm'
        : 'text-(--note-text-muted) hover:text-(--note-text)'
    }`;

  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center text-(--text-secondary)">
        <div className="h-6 w-6 rounded-full border-2 border-(--text-secondary) border-t-(--text-primary) animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-(--app-bg) relative">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-10 flex-wrap gap-4"
        >
          <div>
            <h1 className="text-lg font-medium text-(--note-text) mb-0.5">
              {view === 'all'
                ? 'All Todos'
                : view === 'today'
                ? 'Today'
                : view === 'history'
                ? 'History'
                : 'Archived'}
            </h1>
            <p className="text-sm text-(--note-text-muted)">
              {view === 'all'
                ? 'A simple space for your tasks'
                : view === 'today'
                ? `${dailyCount} item${dailyCount !== 1 ? 's' : ''} for today`
                : view === 'history'
                ? format(historyDate, 'MMMM d, yyyy')
                : `${archivedCount} archived section${archivedCount !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-(--note-control-bg-hover) rounded-md p-0.5">
              <button onClick={() => handleViewChange('today')} className={tabClass(view === 'today')}>
                <Star className="w-3 h-3" />
                Today
              </button>
              <button onClick={() => handleViewChange('all')} className={tabClass(view === 'all')}>
                <List className="w-3 h-3" />
                All
              </button>
              <button onClick={() => handleViewChange('history')} className={tabClass(view === 'history')}>
                <Clock className="w-3 h-3" />
                History
              </button>
              <button onClick={() => handleViewChange('archived')} className={tabClass(view === 'archived')}>
                <Archive className="w-3 h-3" />
                Archived
              </button>
            </div>

            {view === 'all' && (
              <SectionMenu
                sections={activeSections}
                onScrollTo={scrollToSection}
                onReorder={reorderSections}
                onDelete={deleteSection}
                onArchive={archiveSection}
              />
            )}

            {archivedCount > 0 && view !== 'archived' && (
              <button
                onClick={() => handleViewChange('archived')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-(--note-text-muted) hover:text-(--note-text) transition-colors rounded-md hover:bg-(--note-control-bg-hover)"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>{archivedCount}</span>
              </button>
            )}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {view === 'all' ? (
            <motion.div
              key="all"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              <div className="mb-10">
                <div className="relative">
                  {isSearching && (
                    <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-(--note-text-muted)" />
                  )}
                  <input
                    type="text"
                    value={newSectionTitle}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Create new section… or type / to search"
                    className={`w-full bg-transparent border-none outline-none text-base font-medium text-(--note-text) placeholder:text-(--note-text-muted) ${isSearching ? 'pl-6' : ''}`}
                  />
                </div>
                <AnimatePresence>
                  {newSectionTitle.trim() && !isSearching && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="text-xs text-(--note-text-muted) mt-2"
                    >
                      Press Enter to create
                    </motion.p>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {isSearching && searchQuery.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="mt-3 space-y-4"
                    >
                      {sections
                        .map((s) => ({
                          ...s,
                          matchingTodos: s.todos.filter((t) =>
                            t.text.toLowerCase().includes(searchQuery.toLowerCase())
                          ),
                        }))
                        .filter((s) => s.matchingTodos.length > 0)
                        .map((s) => (
                          <div key={s.id}>
                            <p className="text-[11px] uppercase tracking-wider text-(--note-text-muted) mb-2 font-medium">
                              {s.title}
                            </p>
                            <div className="space-y-0.5">
                              {s.matchingTodos.map((todo) => (
                                <div
                                  key={todo.id}
                                  className="flex items-start gap-3 py-1 px-1 rounded hover:bg-(--note-control-bg-hover) transition-colors cursor-pointer"
                                  onClick={() => {
                                    setNewSectionTitle('');
                                    setIsSearching(false);
                                    setSearchQuery('');
                                    scrollToSection(s.id);
                                  }}
                                >
                                  <div
                                    className={`todo-checkbox flex-shrink-0 mt-0.5 cursor-default ${todo.completed ? 'checked' : ''}`}
                                  >
                                    {todo.completed && (
                                      <svg
                                        className="w-3 h-3 text-(--note-checkbox-checked-border)"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth={3}
                                      >
                                        <polyline points="20 6 9 17 4 12" />
                                      </svg>
                                    )}
                                  </div>
                                  <span
                                    className={`text-sm leading-relaxed ${todo.completed ? 'line-through text-(--note-text-muted)' : 'text-(--note-text)'}`}
                                  >
                                    {todo.text}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      {sections.every((s) =>
                        s.todos.every(
                          (t) => !t.text.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                      ) && <p className="text-sm text-(--note-text-muted)">No matching todos</p>}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext
                  items={activeSections.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {activeSections.map((section, index) => (
                      <TodoSection
                        key={section.id}
                        id={section.id}
                        title={section.title}
                        todos={section.todos}
                        onTitleChange={updateSectionTitle}
                        onArchive={archiveSection}
                        onDelete={deleteSection}
                        onMoveUp={(id) => moveSection(id, 'up')}
                        onMoveDown={(id) => moveSection(id, 'down')}
                        isFirst={index === 0}
                        isLast={index === activeSections.length - 1}
                        onToggleDaily={toggleDaily}
                        onAddTodo={addTodo}
                        onAddTodoBelow={addTodoBelow}
                        onToggleTodo={toggleTodoCompleted}
                        onUpdateTodo={updateTodo}
                        onDeleteTodo={deleteTodo}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {activeSections.length === 0 && (
                <div className="text-center py-16 text-(--note-text-muted)">
                  <p className="text-sm">No sections yet. Create one above.</p>
                </div>
              )}
            </motion.div>
          ) : view === 'today' ? (
            <motion.div
              key="today"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              {dailyBySection.length === 0 ? (
                <div className="text-center py-16 text-(--note-text-muted)">
                  <Star className="w-5 h-5 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No todos for today</p>
                  <p className="text-xs mt-1">
                    Mark todos with <Star className="w-3 h-3 inline -mt-0.5" /> in the All view
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {dailyBySection.map((group) => (
                    <div key={group.id}>
                      <p className="text-[11px] uppercase tracking-wider text-(--note-text-muted) mb-3 font-medium">
                        {group.title}
                      </p>
                      <div className="space-y-0.5">
                        <AnimatePresence mode="popLayout">
                          {group.todos.map((todo) => (
                            <TodoItem
                              key={todo.id}
                              id={todo.id}
                              text={todo.text}
                              completed={todo.completed}
                              daily={true}
                              onToggle={() => toggleTodoCompleted(group.id, todo.id)}
                              onUpdate={() => {}}
                              onDelete={() => {}}
                              onAddBelow={() => {}}
                              readOnly
                              onToggleDaily={() => toggleDaily(group.id, todo.id)}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : view === 'history' ? (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              <div className="flex items-center justify-between mb-8">
                <button
                  onClick={() => setHistoryDate(subDays(historyDate, 1))}
                  className="p-1.5 text-(--note-text-muted) hover:text-(--note-text) transition-colors rounded hover:bg-(--note-control-bg-hover)"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="text-center">
                  <p className="text-sm font-medium text-(--note-text)">
                    {isToday(historyDate) ? 'Today' : format(historyDate, 'EEEE')}
                  </p>
                  <p className="text-xs text-(--note-text-muted)">
                    {format(historyDate, 'MMM d, yyyy')}
                  </p>
                </div>
                <button
                  onClick={() => setHistoryDate(addDays(historyDate, 1))}
                  className="p-1.5 text-(--note-text-muted) hover:text-(--note-text) transition-colors rounded hover:bg-(--note-control-bg-hover)"
                  disabled={isToday(historyDate)}
                >
                  <ChevronRight
                    className={`w-4 h-4 ${isToday(historyDate) ? 'opacity-30' : ''}`}
                  />
                </button>
              </div>

              {daySnapshot && daySnapshot.length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(
                    daySnapshot.reduce<Record<string, DaySnapshotItem[]>>((acc, item) => {
                      if (!acc[item.sectionTitle]) acc[item.sectionTitle] = [];
                      acc[item.sectionTitle].push(item);
                      return acc;
                    }, {})
                  ).map(([sectionTitle, items]) => (
                    <div key={sectionTitle}>
                      <p className="text-[11px] uppercase tracking-wider text-(--note-text-muted) mb-3 font-medium">
                        {sectionTitle}
                      </p>
                      <div className="space-y-1">
                        {items.map((item) => (
                          <div key={item.todoId} className="flex items-start gap-3 py-1 px-1">
                            <div
                              className={`todo-checkbox flex-shrink-0 mt-0.5 cursor-default ${item.completed ? 'checked' : ''}`}
                            >
                              {item.completed && (
                                <svg
                                  className="w-3 h-3 text-(--note-checkbox-checked-border)"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth={3}
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </div>
                            <span
                              className={`text-sm leading-relaxed ${
                                item.completed
                                  ? 'line-through text-(--note-text-muted)'
                                  : 'text-(--note-text)'
                              }`}
                            >
                              {item.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-(--note-border)">
                    <p className="text-xs text-(--note-text-muted)">
                      {daySnapshot.filter((i) => i.completed).length}/{daySnapshot.length} completed
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-(--note-text-muted)">
                  <Clock className="w-5 h-5 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No daily todos recorded for this day</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="archived"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              {archivedSections.length === 0 ? (
                <div className="text-center py-16 text-(--note-text-muted)">
                  <Archive className="w-5 h-5 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No archived sections</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {archivedSections.map((section) => (
                    <div key={section.id}>
                      <p className="text-[11px] uppercase tracking-wider text-(--note-text-muted) mb-3 font-medium">
                        {section.title}
                      </p>
                      <div className="space-y-1">
                        {section.todos.map((todo) => (
                          <div key={todo.id} className="flex items-start gap-3 py-1 px-1">
                            <div
                              className={`todo-checkbox flex-shrink-0 mt-0.5 cursor-default ${todo.completed ? 'checked' : ''}`}
                            >
                              {todo.completed && (
                                <svg
                                  className="w-3 h-3 text-(--note-checkbox-checked-border)"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth={3}
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                              )}
                            </div>
                            <span
                              className={`text-sm leading-relaxed ${
                                todo.completed
                                  ? 'line-through text-(--note-text-muted)'
                                  : 'text-(--note-text)'
                              }`}
                            >
                              {todo.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
