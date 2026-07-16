# TODO — Student Task Manager improvements

- [x] Step 1: Update `index.html`
  - Add Dark/Light mode toggle control
  - Add Priority + Due Date inputs to “Add a task” form
  - Add Sort controls (date/alphabetical/priority)
  - Add UI region for overdue notifications (if needed)
  - Ensure existing UI elements remain

- [x] Step 2: Update `style.css`
  - Add theme variables/styles for dark mode
  - Add styles for priority badge and due date display
  - Add overdue styling
  - Style new sort controls + theme toggle

- [x] Step 3: Update `script.js`
  - Extend data model: `priority` + `dueDate`
  - Normalize/loading of old localStorage data
  - Implement sorting integration with search + status filters
  - Add overdue detection + notification + row highlighting
  - Persist theme preference
  - Improve error handling around storage/JSON parsing
  - Optimize render/stat updates (reduce redundant DOM writes)

- [x] Step 4: Verify behavior
  - Add/edit/delete/clear all/search/filter still work
  - Sort options behave as expected
  - Overdue notification triggers correctly
  - Empty state is professional
