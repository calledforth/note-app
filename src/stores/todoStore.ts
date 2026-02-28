import { create } from 'zustand';
import { arrayMove } from '@dnd-kit/sortable';
import { format } from 'date-fns';

// ============================================================================
// TYPES
// ============================================================================

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  daily?: boolean;
  completedAt?: string;
}

export interface TodoSection {
  id: string;
  title: string;
  todos: Todo[];
  archived: boolean;
}

export interface DaySnapshotItem {
  todoId: string;
  text: string;
  completed: boolean;
  sectionTitle: string;
}

export interface DaySnapshot {
  date: string;
  items: DaySnapshotItem[];
}

export type TodoView = 'today' | 'all' | 'history' | 'archived';

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// ============================================================================
// STORE
// ============================================================================

interface TodoStore {
  sections: TodoSection[];
  history: DaySnapshot[];
  lastView: TodoView;
  isLoaded: boolean;

  load: () => Promise<void>;
  setLastView: (view: TodoView) => Promise<void>;

  addSection: (title: string) => Promise<string>;
  updateSectionTitle: (sectionId: string, title: string) => Promise<void>;
  archiveSection: (sectionId: string) => Promise<void>;
  deleteSection: (sectionId: string) => Promise<void>;
  reorderSections: (oldIndex: number, newIndex: number) => Promise<void>;
  moveSection: (sectionId: string, direction: 'up' | 'down') => Promise<void>;

  addTodo: (sectionId: string) => Promise<string>;
  addTodoBelow: (sectionId: string, afterTodoId: string) => Promise<string>;
  updateTodo: (sectionId: string, todoId: string, text: string) => Promise<void>;
  toggleTodoCompleted: (sectionId: string, todoId: string) => Promise<void>;
  deleteTodo: (sectionId: string, todoId: string) => Promise<void>;
  toggleDaily: (sectionId: string, todoId: string) => Promise<void>;

  saveHistorySnapshot: (dateKey: string) => Promise<void>;
  getHistoryForDate: (dateKey: string) => DaySnapshotItem[];
}

async function getApi() {
  const api = window.electronAPI;
  if (!api?.todo) throw new Error('Todo API not available');
  return api;
}

export const useTodoStore = create<TodoStore>((set, get) => ({
  sections: [],
  history: [],
  lastView: 'today',
  isLoaded: false,

  load: async () => {
    const api = await getApi();

    const dbSections = await api.todo.getSections();
    const sections: TodoSection[] = [];

    for (const s of dbSections as any[]) {
      const items = await api.todo.getItems(s.id);
      const todos: Todo[] = (items as any[]).map((i) => ({
        id: i.id,
        text: i.text || '',
        completed: Boolean(i.completed),
        daily: Boolean(i.daily),
        completedAt: i.completedAt,
      }));
      sections.push({
        id: s.id,
        title: s.title || '',
        todos,
        archived: Boolean(s.archived),
      });
    }

    const allHistory = await api.todo.getAllHistory();
    const history: DaySnapshot[] = allHistory.map((h) => ({ date: h.date, items: h.items as DaySnapshotItem[] }));

    let lastView: TodoView = 'today';
    const stored = await api.settings.get('lastTodoView');
    if (stored && ['today', 'all', 'history', 'archived'].includes(stored)) {
      lastView = stored as TodoView;
    }

    set({ sections, history, lastView, isLoaded: true });
  },

  setLastView: async (view: TodoView) => {
    const api = await getApi();
    await api.settings.set('lastTodoView', view);
    set({ lastView: view });
  },

  addSection: async (title: string) => {
    const api = await getApi();
    const id = generateId();
    const now = Date.now();

    const sections = get().sections;

    await api.todo.createSection({
      id,
      title,
      sortOrder: 0,
      archived: false,
      createdAt: now,
    });

    for (let i = 0; i < sections.length; i++) {
      await api.todo.updateSection(sections[i].id, { sortOrder: i + 1 });
    }

    set({
      sections: [{ id, title, todos: [], archived: false }, ...sections],
    });
    return id;
  },

  updateSectionTitle: async (sectionId: string, title: string) => {
    const api = await getApi();
    await api.todo.updateSection(sectionId, { title });
    set((s) => ({
      sections: s.sections.map((sec) => (sec.id === sectionId ? { ...sec, title } : sec)),
    }));
  },

  archiveSection: async (sectionId: string) => {
    const api = await getApi();
    await api.todo.updateSection(sectionId, { archived: true });
    set((s) => ({
      sections: s.sections.map((sec) => (sec.id === sectionId ? { ...sec, archived: true } : sec)),
    }));
  },

  deleteSection: async (sectionId: string) => {
    const api = await getApi();
    await api.todo.deleteSection(sectionId);
    set((s) => ({ sections: s.sections.filter((sec) => sec.id !== sectionId) }));
  },

  reorderSections: async (oldIndex: number, newIndex: number) => {
    const { sections } = get();
    const active = sections.filter((s) => !s.archived);
    const archived = sections.filter((s) => s.archived);
    const newOrder = arrayMove(active, oldIndex, newIndex);
    const reordered = [...newOrder, ...archived];

    const api = await getApi();
    for (let i = 0; i < reordered.length; i++) {
      await api.todo.updateSection(reordered[i].id, { sortOrder: i });
    }
    set({ sections: reordered });
  },

  moveSection: async (sectionId: string, direction: 'up' | 'down') => {
    const { sections } = get();
    const activeIds = sections.filter((s) => !s.archived).map((s) => s.id);
    const idx = activeIds.indexOf(sectionId);
    if ((direction === 'up' && idx <= 0) || (direction === 'down' && idx >= activeIds.length - 1)) return;
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    await get().reorderSections(idx, swapIdx);
  },

  addTodo: async (sectionId: string) => {
    const api = await getApi();
    const id = generateId();
    const now = Date.now();

    const sections = get().sections;
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return '';

    const sortOrder = section.todos.length;

    await api.todo.createItem({
      id,
      sectionId,
      text: '',
      completed: false,
      daily: false,
      sortOrder,
      createdAt: now,
    });

    const newTodo: Todo = { id, text: '', completed: false };
    set({
      sections: sections.map((s) =>
        s.id === sectionId ? { ...s, todos: [...s.todos, newTodo] } : s
      ),
    });
    return id;
  },

  addTodoBelow: async (sectionId: string, afterTodoId: string) => {
    const api = await getApi();
    const id = generateId();
    const now = Date.now();

    const sections = get().sections;
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return '';

    const idx = section.todos.findIndex((t) => t.id === afterTodoId);
    const insertAt = idx < 0 ? section.todos.length : idx + 1;
    const newTodos = [...section.todos];
    newTodos.splice(insertAt, 0, { id, text: '', completed: false });

    for (let i = 0; i < newTodos.length; i++) {
      const t = newTodos[i];
      if (t.id === id) {
        await api.todo.createItem({
          id,
          sectionId,
          text: '',
          completed: false,
          daily: false,
          sortOrder: i,
          createdAt: now,
        });
      } else {
        await api.todo.updateItem(t.id, { sortOrder: i });
      }
    }

    set({
      sections: sections.map((s) =>
        s.id === sectionId ? { ...s, todos: newTodos } : s
      ),
    });
    return id;
  },

  updateTodo: async (sectionId: string, todoId: string, text: string) => {
    const api = await getApi();
    await api.todo.updateItem(todoId, { text });
    set((s) => ({
      sections: s.sections.map((sec) =>
        sec.id === sectionId
          ? { ...sec, todos: sec.todos.map((t) => (t.id === todoId ? { ...t, text } : t)) }
          : sec
      ),
    }));
  },

  toggleTodoCompleted: async (sectionId: string, todoId: string) => {
    const { sections } = get();
    const section = sections.find((s) => s.id === sectionId);
    const todo = section?.todos.find((t) => t.id === todoId);
    if (!todo) return;

    const completed = !todo.completed;
    const completedAt = completed ? new Date().toISOString() : undefined;

    const api = await getApi();
    await api.todo.updateItem(todoId, { completed, completedAt });

    set((s) => ({
      sections: s.sections.map((sec) =>
        sec.id === sectionId
          ? {
              ...sec,
              todos: sec.todos.map((t) =>
                t.id === todoId ? { ...t, completed, completedAt } : t
              ),
            }
          : sec
      ),
    }));

    const todayKey = format(new Date(), 'yyyy-MM-dd');
    get().saveHistorySnapshot(todayKey);
  },

  deleteTodo: async (sectionId: string, todoId: string) => {
    const api = await getApi();
    await api.todo.deleteItem(todoId);
    set((s) => ({
      sections: s.sections.map((sec) =>
        sec.id === sectionId ? { ...sec, todos: sec.todos.filter((t) => t.id !== todoId) } : sec
      ),
    }));
  },

  toggleDaily: async (sectionId: string, todoId: string) => {
    const { sections } = get();
    const todo = sections.flatMap((s) => s.todos).find((t) => t.id === todoId);
    if (!todo) return;

    const daily = !(todo.daily ?? false);

    const api = await getApi();
    await api.todo.updateItem(todoId, { daily });

    set((s) => ({
      sections: s.sections.map((sec) =>
        sec.id === sectionId
          ? { ...sec, todos: sec.todos.map((t) => (t.id === todoId ? { ...t, daily } : t)) }
          : sec
      ),
    }));

    const todayKey = format(new Date(), 'yyyy-MM-dd');
    get().saveHistorySnapshot(todayKey);
  },

  saveHistorySnapshot: async (dateKey: string) => {
    const { sections } = get();
    const dailyItems: DaySnapshotItem[] = sections.flatMap((s) =>
      s.todos
        .filter((t) => t.daily)
        .map((t) => ({
          todoId: t.id,
          text: t.text,
          completed: t.completed,
          sectionTitle: s.title,
        }))
    );

    const api = await getApi();
    await api.todo.saveHistory(dateKey, dailyItems);

    set((s) => {
      const history = [...s.history];
      const idx = history.findIndex((h) => h.date === dateKey);
      const entry = { date: dateKey, items: dailyItems };
      if (idx >= 0) history[idx] = entry;
      else history.push(entry);
      history.sort((a, b) => b.date.localeCompare(a.date));
      return { history };
    });
  },

  getHistoryForDate: (dateKey: string) => {
    const entry = get().history.find((h) => h.date === dateKey);
    return entry?.items ?? [];
  },
}));
