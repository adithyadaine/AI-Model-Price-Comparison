export const state = {
  models: [],
  selectedIds: new Set(),
  currentView: "table",
  search: {
    term: "",
    category: "all"
  },
  sort: {
    column: "releaseDate",
    direction: "desc"
  }
};

export function setModels(data) {
  state.models = data;
}

export function addToSelection(id) {
  state.selectedIds.add(id);
}

export function removeFromSelection(id) {
  state.selectedIds.delete(id);
}

export function clearSelection() {
  state.selectedIds.clear();
}

export function setSelection(ids) {
  state.selectedIds = new Set(ids);
}

export function getSelectedModels() {
  return state.models.filter(m => state.selectedIds.has(m.id));
}
