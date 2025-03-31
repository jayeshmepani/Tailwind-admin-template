class TableComponent {
    constructor(options) {
        this.options = {
            containerId: options.containerId,
            dataUrl: options.dataUrl,
            pageSizeOptions: options.pageSizeOptions || [10, 25, 50, 100, 'All'],
            defaultPageSize: options.defaultPageSize || 10,
            showPagination: options.showPagination !== undefined ? options.showPagination : true,
            enableSearch: options.enableSearch !== undefined ? options.enableSearch : true,
            enableColumnsDropdown: options.enableColumnsDropdown !== undefined ? options.enableColumnsDropdown : true,
            enableExportDropdown: options.enableExportDropdown !== undefined ? options.enableExportDropdown : true,
            enableFullscreen: options.enableFullscreen !== undefined ? options.enableFullscreen : true,
            enableViewToggle: options.enableViewToggle !== undefined ? options.enableViewToggle : true,
            enableDelete: options.enableDelete !== undefined ? options.enableDelete : true,
            enableRefresh: options.enableRefresh !== undefined ? options.enableRefresh : true,
            useFlowbite: options.useFlowbite !== undefined ? options.useFlowbite : true,
            customActions: options.customActions || [],
            editable: options.editable !== undefined ? options.editable : true,
            serverSide: options.serverSide !== undefined ? options.serverSide : false,
        };
        this.tableData = [];
        this.filteredData = [];
        this.currentPage = 1;
        this.pageSize = this.options.defaultPageSize === 'All' ? 'All' : parseInt(this.options.defaultPageSize, 10);
        this.sortField = null;
        this.sortOrder = 'asc';
        this.selections = [];
        this.viewMode = 'table';
        this.totalItems = 0;
        this.isLoading = false;
        this.columns = [];
        this.editedData = {};
        this.deleteModalId = `delete-modal-${this.options.containerId}`;
        this.editModalId = `edit-modal-container-${this.options.containerId}`;
        this.deleteModal = null;
        this.editModal = null;
        this.currentSearchTerm = '';
        this.editedItemId = null;
        this.itemToDelete = null;
        this.container = $('#' + this.options.containerId);
        if (!this.container.length) {
            console.error(`TableComponent Error: Container with ID #${this.options.containerId} not found.`);
            return;
        }
        this.toolbarContainer = null;
        this.tableContainer = null;
        this.cardContainer = null;
        this.footerContainer = null;
        this.loadLibraries().then(() => {
            this.init();
            if (this.options.editable) {
                this.createEditModal();
            }
            if (this.options.enableDelete || this.options.customActions.some(a => a.modalId === this.deleteModalId || (a.type === 'modal' && a.label === 'Delete'))) {
                this.createDeleteModal();
            }
            setTimeout(() => {
                try {
                    if (window.Modal) {
                        if (this.options.editable && document.getElementById(this.editModalId)) {
                            this.editModal = new Modal(document.getElementById(this.editModalId));
                        }
                        if (document.getElementById(this.deleteModalId)) {
                            this.deleteModal = new Modal(document.getElementById(this.deleteModalId));
                        }
                    } else {
                        console.warn("Flowbite Modal class not found. Modals will not be functional.");
                    }
                    if (window.flowbite && typeof window.flowbite.initFlowbite === 'function') {
                        window.flowbite.initFlowbite();
                    }
                } catch (e) {
                    console.error("Error initializing Flowbite components:", e);
                }
                this.fetchData();
                this.addEventListeners();
            }, 150);
        }).catch(error => {
            console.error("Error loading libraries:", error);
            this.container.html('<p class="text-red-600">Error loading required libraries. Table cannot be initialized.</p>');
        });
    }
    async loadLibraries() {
        if (this.options.enableExportDropdown) {
            try {
                if (typeof XLSX === 'undefined') await this.loadScript('/js/xlsx.full.min.js');
                if (typeof saveAs === 'undefined') await this.loadScript('/js/FileSaver.min.js');
            } catch (e) {
                console.error("Error loading export libraries:", e);
                this.options.enableExportDropdown = false;
            }
        }
    }
    loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${src}"]`)) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
            document.head.appendChild(script);
        });
    }
    init() {
        this.createToolbarHtml();
        this.createBaseHtml();
        this.createFooterHtml();
        if (!window.tableComponentInstances) {
            window.tableComponentInstances = {};
        }
        window.tableComponentInstances[this.options.containerId] = this;
    }
    createToolbarHtml() {
        const toolbarId = `toolbar-component-${this.options.containerId}`;
        this.toolbarContainer = $(`<div id="${toolbarId}" class="table-toolbar"></div>`);
        this.container.append(this.toolbarContainer);
        let html = `
             <div class="flex flex-wrap justify-between items-center mb-4">
                 ${this.options.enableDelete ? `
                 <div>
                     <button id="remove-${this.options.containerId}" title="Delete Selected"
                         class="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-opacity-50 transition-colors" disabled>
                         <i class="fa fa-trash"></i>
                     </button>
                 </div>` : ''}
                 <div class="flex flex-wrap items-center gap-3 mt-2 sm:mt-0 max-sm:justify-end">
                     ${this.options.enableSearch ? `
                     <div class="relative w-48 md:w-64">
                         <label for="search-${this.options.containerId}" class="sr-only">Search</label>
                         <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                             <i class="fa fa-search text-gray-600"></i>
                         </div>
                         <input id="search-${this.options.containerId}" type="text" placeholder="Search..."
                             class="block w-full pl-10 pr-3 py-2 border border-gray-400 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 sm:text-sm">
                     </div>` : ''}
                     <div class="inline-flex rounded-md shadow-sm" role="group">
                         ${this.options.enableRefresh ? `
                         <button id="refresh-${this.options.containerId}" title="Refresh" data-action-id="refresh"
                             class="text-gray-700 bg-gray-200 hover:bg-gray-300 focus:bg-gray-300 px-4 py-2 focus:outline-none transition-colors border-l border-y rounded-l-lg border-gray-400">
                             <i class="fa fa-sync-alt"></i>
                         </button>` : ''}
                         ${this.options.enableViewToggle ? `
                         <button id="toggle-${this.options.containerId}" title="Toggle View" data-action-id="toggle-view"
                             class="text-gray-700 bg-gray-200 hover:bg-gray-300 focus:bg-gray-300 px-4 py-2 focus:outline-none transition-colors border-x border-y border-gray-400">
                             <i class="fa fa-table"></i>
                         </button>` : ''}
                         ${this.options.enableFullscreen ? `
                         <button id="fullscreen-${this.options.containerId}" title="Fullscreen"  data-action-id="fullscreen"
                             class="text-gray-700 bg-gray-200 hover:bg-gray-300 focus:bg-gray-300 px-4 py-2 focus:outline-none transition-colors border-r border-y border-gray-400">
                             <i class="fa fa-expand"></i>
                         </button>` : ''}
                         ${this.options.enableColumnsDropdown ? `
                         <div class="relative dropdown">
                             <button id="columns-dropdown-button-${this.options.containerId}" title="Columns" data-dropdown-toggle="columns-dropdown-${this.options.containerId}"
                                 class="text-gray-700 bg-gray-200 hover:bg-gray-300 focus:bg-gray-300 px-4 py-2 focus:outline-none transition-colors border-r border-y border-gray-400">
                                 <i class="fa fa-columns mr-1"></i>
                                 <i class="fa fa-caret-down ml-1"></i>
                             </button>
                             <div id="columns-dropdown-${this.options.containerId}"
                                 class="dropdown-content hidden absolute z-50 bg-white shadow-lg rounded-lg mt-1 p-2 border border-gray-300 w-48 right-0" data-popper-placement="bottom-end">
                                 <div class="mb-2">
                                     <label class="inline-flex items-center">
                                         <input type="checkbox" id="toggle-all-columns-${this.options.containerId}"
                                             class="form-checkbox h-4 w-4 text-blue-600" checked>
                                         <span class="ml-2 text-sm text-gray-700">Toggle All</span>
                                     </label>
                                 </div>
                                 <hr class="my-2 border-gray-300">
                                 <div id="columns-list-${this.options.containerId}" class="space-y-2 max-h-60 overflow-y-auto">
                                 </div>
                             </div>
                         </div>` : ''}
                         ${this.options.enableExportDropdown ? `
                         <div class="relative dropdown">
                             <button id="export-dropdown-button-${this.options.containerId}" title="Export" data-dropdown-toggle="export-dropdown-${this.options.containerId}"
                                 class="text-gray-700 bg-gray-200 hover:bg-gray-300 focus:bg-gray-300 px-4 py-2 focus:outline-none transition-colors border-r rounded-r-lg border-y border-gray-400">
                                 <i class="fa fa-download mr-1"></i>
                                 <i class="fa fa-caret-down ml-1"></i>
                             </button>
                             <div id="export-dropdown-${this.options.containerId}"
                                 class="dropdown-content hidden absolute z-50 bg-white shadow-lg rounded-lg mt-1 p-2 border border-gray-300 w-48 right-0" data-popper-placement="bottom-end">
                                 <button class="w-full text-left text-gray-700 px-4 py-2 hover:bg-gray-200 rounded transition-colors duration-200" data-export="csv">Export to CSV</button>
                                 <button class="w-full text-left text-gray-700 px-4 py-2 hover:bg-gray-200 rounded transition-colors duration-200" data-export="xlsx">Export to Excel</button>
                                 <button class="w-full text-left text-gray-700 px-4 py-2 hover:bg-gray-200 rounded transition-colors duration-200" data-export="json">Export to JSON</button>
                             </div>
                         </div>` : ''}
                     </div>
                 </div>
             </div>
         `;
        this.toolbarContainer.html(html);
    }
    createBaseHtml() {
        const tableId = `table-component-${this.options.containerId}`;
        this.tableContainer = $(`<div id="${tableId}" class="table-component-view ${this.viewMode === 'table' ? '' : 'hidden'}"></div>`);
        this.container.append(this.tableContainer);
        let tableHtml = `
             <div class="relative overflow-x-auto shadow-lg sm:rounded-lg mt-5 border border-gray-300">
                 <div class="loading-overlay hidden absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                     <i class="fa fa-spinner fa-spin fa-3x fa-fw text-blue-600"></i>
                 </div>
                 <table id="data-table-${this.options.containerId}" class="w-full text-sm text-left text-gray-600">
                     <thead class="text-xs text-gray-700 uppercase bg-gray-300">
                     </thead>
                     <tbody>
                     </tbody>
                 </table>
             </div>
         `;
        this.tableContainer.html(tableHtml);
        this.cardContainer = $(`<div id="card-container-${this.options.containerId}" class="table-component-view ${this.viewMode === 'card' ? '' : 'hidden'} w-full grid grid-cols-[repeat(auto-fill,_minmax(320px,_1fr))] gap-6 mt-6"></div>`);
        this.container.append(this.cardContainer);
    }
    createFooterHtml() {
        const footerId = `footer-component-${this.options.containerId}`;
        this.footerContainer = $(`<div id="${footerId}" class="table-footer mt-8"></div>`);
        this.container.append(this.footerContainer);
        let html = `
             <div class="flex flex-wrap justify-between items-center">
                 <div>
                     <label for="page-size-${this.options.containerId}" class="mr-2 text-sm font-medium text-gray-700">Items per page:</label>
                     <select id="page-size-${this.options.containerId}" class="bg-white border border-gray-400 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600">
                         ${this.options.pageSizeOptions.map(size => `<option value="${size}" ${size == this.pageSize ? 'selected' : ''}>${size}</option>`).join('')}
                     </select>
                 </div>
                 <div class="flex items-center mt-4 sm:mt-0">
                     <label class="mr-3 text-sm font-medium text-gray-700 hidden">
                         <input type="checkbox" id="toggle-pagination-${this.options.containerId}" class="mr-1" ${this.options.showPagination ? 'checked' : ''}>
                         Show Pagination
                     </label>
                     <nav aria-label="Page navigation" class="pagination-container ${this.options.showPagination ? '' : 'hidden'}">
                         <ul class="inline-flex -space-x-px text-sm">
                             <li>
                                 <button id="prev-page-${this.options.containerId}" class="flex items-center justify-center px-3 h-8 ml-0 leading-tight text-gray-600 bg-white border border-gray-400 rounded-l-lg hover:bg-gray-200 hover:text-gray-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                                     <i class="fa fa-chevron-left"></i>
                                 </button>
                             </li>
                             <li id="pagination-numbers-${this.options.containerId}" class="flex items-center">
                             </li>
                             <li>
                                 <button id="next-page-${this.options.containerId}" class="flex items-center justify-center px-3 h-8 leading-tight text-gray-600 bg-white border border-gray-400 rounded-r-lg hover:bg-gray-200 hover:text-gray-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                                     <i class="fa fa-chevron-right"></i>
                                 </button>
                             </li>
                         </ul>
                     </nav>
                 </div>
             </div>
             <div class="text-sm text-gray-600 mt-4" id="page-info-${this.options.containerId}">
                 Showing 0 to 0 of 0 entries
             </div>
         `;
        this.footerContainer.html(html);
    }
    showLoading() { this.isLoading = true; this.tableContainer.find('.loading-overlay').removeClass('hidden'); }
    hideLoading() { this.isLoading = false; this.tableContainer.find('.loading-overlay').addClass('hidden'); }
    naturalSort(a, b) {
        const ax = [], bx = [];
        String(a).replace(/(\d+)|(\D+)/g, function (_, $1, $2) { ax.push([$1 || Infinity, $2 || ""]) });
        String(b).replace(/(\d+)|(\D+)/g, function (_, $1, $2) { bx.push([$1 || Infinity, $2 || ""]) });
        while (ax.length && bx.length) {
            const an = ax.shift();
            const bn = bx.shift();
            const nn = (an[0] - bn[0]) || an[1].localeCompare(bn[1]);
            if (nn) return nn;
        }
        return ax.length - bx.length;
    }
    fetchData() {
        if (this.isLoading) return;
        this.showLoading();
        let params = {};
        let url = this.options.dataUrl;
        if (this.options.serverSide) {
            params = {
                limit: this.pageSize === 'All' ? -1 : this.pageSize,
                offset: this.pageSize === 'All' ? 0 : (this.currentPage - 1) * this.pageSize,
                sort: this.sortField,
                order: this.sortOrder,
                search: this.currentSearchTerm
            };
            Object.keys(params).forEach(key => (params[key] == null || params[key] === '') && delete params[key]);
        }
        axios.get(url, { params: params })
            .then(response => {
                if (response.data && Array.isArray(response.data.rows)) {
                    const responseData = response.data.rows;
                    const serverTotal = this.options.serverSide ? parseInt(response.data.total, 10) : responseData.length;
                    this.totalItems = isNaN(serverTotal) ? 0 : serverTotal;
                    if (this.columns.length === 0 && responseData.length > 0) {
                        this.columns = Object.keys(responseData[0]).map(key => ({
                            field: key,
                            title: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                            sortable: true,
                            visible: true
                        }));
                        if (this.options.customActions.length > 0 || this.options.editable || this.options.enableDelete) {
                            if (!this.columns.some(c => c.field === 'actions')) {
                                this.columns.push({ field: 'actions', title: "Actions", sortable: false, visible: true });
                            }
                        }
                        this.initColumnToggles();
                    }
                    if (this.options.serverSide) {
                        this.tableData = responseData;
                        this.updateTable(this.tableData);
                    } else {
                        this.tableData = responseData;
                        this.updateTable();
                    }
                } else {
                    console.error('Invalid data format received:', response.data);
                    this.displayError(`Invalid data format received.`);
                    this.totalItems = 0;
                    this.tableData = [];
                    this.updateTable([]);
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                this.displayError(`Error loading data: ${error.message || 'Network error'}`);
                this.totalItems = 0;
                this.tableData = [];
                this.updateTable([]);
            })
            .finally(() => {
                this.hideLoading();
            });
    }
    displayError(message) {
        const visibleColsCount = this.columns.filter(c => c.visible).length;
        const colspan = Math.max(1, visibleColsCount + 1);
        this.tableContainer.find(`#data-table-${this.options.containerId} tbody`).html(`<tr><td colspan="${colspan}" class="text-center text-red-600 p-4">${message}</td></tr>`);
        this.cardContainer.html(`<div class="col-span-full text-center text-red-600 p-4">${message}</div>`);
    }
    updateTable(serverData = null) {
        let dataToRender = [];
        let currentTotal = 0;
        if (this.options.serverSide) {
            dataToRender = serverData || [];
            currentTotal = this.totalItems;
        } else {
            const searchTerm = this.currentSearchTerm.toLowerCase();
            this.filteredData = searchTerm
                ? this.tableData.filter(item =>
                    this.columns.some(col => {
                        if (!col.visible || col.field === 'actions') return false;
                        const value = item[col.field];
                        return value !== null && value !== undefined && String(value).toLowerCase().includes(searchTerm);
                    })
                )
                : [...this.tableData];
            currentTotal = this.filteredData.length;
            if (this.sortField) {
                this.filteredData.sort((a, b) => {
                    const aVal = a[this.sortField] ?? '';
                    const bVal = b[this.sortField] ?? '';
                    const comparison = this.naturalSort(aVal, bVal);
                    return comparison * (this.sortOrder === 'asc' ? 1 : -1);
                });
            }
            const pageNum = parseInt(this.currentPage, 10);
            const size = this.pageSize === 'All' ? this.filteredData.length : parseInt(this.pageSize, 10);
            if (isNaN(size) || size <= 0) {
                dataToRender = this.filteredData;
            } else {
                const start = (pageNum - 1) * size;
                dataToRender = this.pageSize === 'All' ? this.filteredData : this.filteredData.slice(start, start + size);
            }
        }
        this.updateTableHeader();
        this.updateTableView(dataToRender);
        this.updateCardView(dataToRender);
        this.updatePagination(currentTotal);
        this.updatePageInfo(dataToRender.length, currentTotal);
        this.updateSortIcons();
        this.updateRemoveButtonState();
        this.updateSelectAllCheckboxState(dataToRender);
    }
    createActionButton(action, item) {
        let buttonHtml = '';
        const modalTargetId = action.modalId ? (action.modalId === 'edit-modal-container' ? this.editModalId : (action.modalId === 'delete-modal' ? this.deleteModalId : action.modalId)) : null;
        const modalAttributes = modalTargetId ? `data-modal-target="${modalTargetId}"` : '';
        const itemIdAttribute = item && item.id !== undefined ? `data-item-id="${item.id}"` : '';
        if (action.type === 'button') {
            if (action.label === 'Edit' && action.modalId === 'edit-modal-container') {
                buttonHtml = `<button ${itemIdAttribute} ${modalAttributes} class="${action.class}" type="button" ${action.attributes || ''}>${action.icon ? `<i class="${action.icon}"></i> ` : ''}${action.label}</button>`;
            } else {
                buttonHtml = `<button ${itemIdAttribute} data-action-type="${action.type}" data-custom-action="${action.label || action.icon}" class="${action.class}" type="button" ${action.attributes || ''}>${action.icon ? `<i class="${action.icon}"></i> ` : ''}${action.label}</button>`;
            }
        } else if (action.type === 'modal') {
            if (action.label === 'Delete' && action.modalId === 'delete-modal') {
                buttonHtml = `<button ${itemIdAttribute} ${modalAttributes} class="${action.class}" type="button">
                    ${action.icon ? `<i class="${action.icon}"></i> ` : ''}${action.label}
                 </button>`;
            } else {
                buttonHtml = `<button ${itemIdAttribute} ${modalAttributes} class="${action.class}" type="button">
                    ${action.icon ? `<i class="${action.icon}"></i> ` : ''}${action.label}
                 </button>`;
            }
        }
        return buttonHtml;
    }
    updateTableView(data) {
        const $tbody = this.tableContainer.find(`#data-table-${this.options.containerId} tbody`);
        $tbody.empty();
        const visibleColumns = this.columns.filter(c => c.visible);
        if (data.length === 0) {
            const colspan = visibleColumns.length + 1;
            $tbody.append(`<tr><td colspan="${colspan}" class="text-center text-gray-600 p-4">No data available</td></tr>`);
            return;
        }
        data.forEach(item => {
            const itemId = item.id;
            if (itemId === undefined) { console.warn("Data item missing 'id' field:", item); return; }
            const isSelected = this.selections.includes(itemId);
            const row = $(`<tr class="bg-white border-b hover:bg-gray-100 transition duration-150 ease-in-out ${isSelected ? 'row-selected bg-blue-100' : ''}" data-id="${itemId}"></tr>`);
            row.append(`<td class="px-4 py-3 w-4"><input type="checkbox" class="row-checkbox form-checkbox h-4 w-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-600 focus:ring-offset-0" data-id="${itemId}" ${isSelected ? 'checked' : ''}></td>`);
            visibleColumns.forEach(column => {
                if (column.field !== 'actions') {
                    const cellValue = item[column.field] === null || item[column.field] === undefined ? '' : item[column.field];
                    const escapedValue = $('<div>').text(cellValue).html();
                    row.append(`<td class="px-6 py-3" data-field="${column.field}">${escapedValue}</td>`);
                }
            });
            if (visibleColumns.some(c => c.field === 'actions')) {
                let actionsHtml = '<td class="px-6 py-3 space-x-1 whitespace-nowrap">';
                if (this.options.editable && !this.options.customActions.some(a => a.label === 'Edit')) {
                    actionsHtml += this.createActionButton({ type: 'button', class: 'bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-xs', icon: 'fa fa-edit', label: 'Edit', modalId: 'edit-modal-container' }, item);
                }
                if (this.options.enableDelete && !this.options.customActions.some(a => a.label === 'Delete')) {
                    actionsHtml += this.createActionButton({ type: 'modal', class: 'bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded text-xs focus:outline-none transition-colors duration-200', icon: 'fa fa-trash', label: 'Delete', modalId: 'delete-modal' }, item);
                }
                this.options.customActions.forEach(action => {
                    actionsHtml += this.createActionButton(action, item);
                });
                actionsHtml += '</td>';
                row.append(actionsHtml);
            }
            $tbody.append(row);
        });
    }
    updateCardView(data) {
        const $cardContainer = this.cardContainer;
        $cardContainer.empty();
        const visibleColumns = this.columns.filter(c => c.visible);
        if (data.length === 0) {
            $cardContainer.append(`<div class="col-span-full text-center text-gray-600 p-4">No data available</div>`);
            return;
        }
        data.forEach(item => {
            const itemId = item.id;
            if (itemId === undefined) { console.warn("Data item missing 'id' field:", item); return; }
            const isSelected = this.selections.includes(itemId);
            const card = $(`
                <div class="card bg-white rounded-lg shadow-md p-4 border border-gray-300 relative ${isSelected ? 'row-selected border-blue-300 ring-2 ring-blue-200' : ''}" data-id="${itemId}">
                    <div class="absolute top-2 right-2">
                        <input type="checkbox" class="row-checkbox card-checkbox form-checkbox h-4 w-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-600 focus:ring-offset-0"
                            data-id="${itemId}" ${isSelected ? 'checked' : ''}>
                    </div>
                    <table class="w-full text-sm mt-4">
                        <tbody>
                            ${visibleColumns.filter(c => c.field !== 'actions').map(column => {
                const cellValue = item[column.field] === null || item[column.field] === undefined ? '' : item[column.field];
                const escapedValue = $('<div>').text(cellValue).html();
                return `
                                    <tr>
                                        <th class="text-left font-semibold text-gray-700 py-1 pr-2 align-top">${column.title}:</th>
                                        <td class="py-1" data-field="${column.field}">${escapedValue}</td>
                                    </tr>`;
            }).join('')}
                        </tbody>
                    </table>
                     ${visibleColumns.some(c => c.field === 'actions') ? `
                     <div class="flex justify-end space-x-1 mt-3 pt-3 border-t border-gray-200">
                         ${this.options.editable && !this.options.customActions.some(a => a.label === 'Edit') ? this.createActionButton({ type: 'button', class: 'bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-xs', icon: 'fa fa-edit', label: 'Edit', modalId: 'edit-modal-container' }, item) : ''}
                         ${this.options.enableDelete && !this.options.customActions.some(a => a.label === 'Delete') ? this.createActionButton({ type: 'modal', class: 'bg-red-600 hover:bg-red-700 text-white py-1 px-2 rounded text-xs focus:outline-none transition-colors duration-200', icon: 'fa fa-trash', label: 'Delete', modalId: 'delete-modal' }, item) : ''}
                         ${this.options.customActions.map(action => this.createActionButton(action, item)).join('')}
                     </div>
                     ` : ''}
                </div>
            `);
            $cardContainer.append(card);
        });
    }
    updateTableHeader() {
        const $thead = this.tableContainer.find(`#data-table-${this.options.containerId} thead`);
        $thead.empty();
        if (this.columns.length === 0) return;
        const headerRow = $('<tr></tr>');
        const visibleColumns = this.columns.filter(c => c.visible);
        headerRow.append(`<th scope="col" class="px-4 py-3 w-4"><input id="select-all-${this.options.containerId}" type="checkbox" class="form-checkbox h-4 w-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-600 focus:ring-offset-0"></th>`);
        visibleColumns.forEach(column => {
            if (column.field !== 'actions') {
                headerRow.append(column.sortable
                    ? `<th scope="col" class="px-6 py-3 cursor-pointer hover:bg-gray-400 transition-colors" data-sort="${column.field}" data-field="${column.field}"><span class="flex items-center justify-between">${column.title} <i class="fa fa-sort ml-1 sort-icon text-gray-500"></i></span></th>`
                    : `<th scope="col" class="px-6 py-3" data-field="${column.field}">${column.title}</th>`
                );
            }
        });
        if (visibleColumns.some(c => c.field === 'actions')) {
            headerRow.append(`<th scope="col" class="px-6 py-3" data-field="actions">Actions</th>`);
        }
        $thead.append(headerRow);
        this.updateSortIcons();
    }
    updatePagination(totalItems) {
        const $paginationContainer = this.footerContainer.find('.pagination-container');
        const $paginationNumbers = this.footerContainer.find(`#pagination-numbers-${this.options.containerId}`);
        const $prevButton = this.footerContainer.find(`#prev-page-${this.options.containerId}`);
        const $nextButton = this.footerContainer.find(`#next-page-${this.options.containerId}`);
        $paginationContainer.toggle(this.options.showPagination && this.pageSize !== 'All');
        if (!this.options.showPagination || this.pageSize === 'All') {
            $paginationNumbers.empty();
            $prevButton.prop('disabled', true);
            $nextButton.prop('disabled', true);
            return;
        }
        $paginationNumbers.empty();
        const numericPageSize = parseInt(this.pageSize, 10);
        if (isNaN(numericPageSize) || numericPageSize <= 0) {
            $prevButton.prop('disabled', true);
            $nextButton.prop('disabled', true);
            return;
        }
        const totalPages = Math.ceil(totalItems / numericPageSize);
        const currentPageNum = parseInt(this.currentPage, 10);
        $prevButton.prop('disabled', currentPageNum === 1);
        $nextButton.prop('disabled', currentPageNum === totalPages || totalPages === 0);
        if (totalPages <= 1) {
            $prevButton.prop('disabled', true);
            $nextButton.prop('disabled', true);
            if (totalPages === 1) {
                $paginationNumbers.append(`<button class="page-number flex items-center justify-center px-3 h-8 leading-tight text-blue-600 bg-blue-100 border border-blue-600" data-page="1">1</button>`);
            }
            return;
        }
        let startPage = Math.max(1, currentPageNum - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        if (endPage === totalPages) {
            startPage = Math.max(1, endPage - 4);
        }
        if (startPage > 1) {
            $paginationNumbers.append(`<button class="page-number flex items-center justify-center px-3 h-8 leading-tight text-gray-600 bg-white border border-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors duration-200" data-page="1">1</button>`);
            if (startPage > 2) $paginationNumbers.append(`<span class="flex items-center justify-center px-3 h-8 leading-tight text-gray-600 border border-gray-400 bg-white">...</span>`);
        }
        for (let i = startPage; i <= endPage; i++) {
            $paginationNumbers.append(`<button class="page-number flex items-center justify-center px-3 h-8 leading-tight ${i === currentPageNum ? 'text-blue-600 bg-blue-100 border border-blue-600 hover:bg-blue-200 hover:text-blue-700' : 'text-gray-600 bg-white border border-gray-400 hover:bg-gray-200 hover:text-gray-700'} transition-colors duration-200" data-page="${i}">${i}</button>`);
        }
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) $paginationNumbers.append(`<span class="flex items-center justify-center px-3 h-8 leading-tight text-gray-600 border border-gray-400 bg-white">...</span>`);
            $paginationNumbers.append(`<button class="page-number flex items-center justify-center px-3 h-8 leading-tight text-gray-600 bg-white border border-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors duration-200" data-page="${totalPages}">${totalPages}</button>`);
        }
    }
    updatePageInfo(renderedCount, totalItems) {
        const $pageInfo = this.footerContainer.find(`#page-info-${this.options.containerId}`);
        if (totalItems === 0) {
            $pageInfo.text(`Showing 0 to 0 of 0 entries`);
            return;
        }
        let start = 0, end = 0;
        if (this.pageSize === 'All') {
            start = totalItems > 0 ? 1 : 0;
            end = totalItems;
        } else {
            const size = parseInt(this.pageSize, 10);
            if (!isNaN(size) && size > 0) {
                start = (this.currentPage - 1) * size + 1;
                end = Math.min(this.currentPage * size, totalItems);
            }
        }
        if (start > end && totalItems > 0) start = end;
        if (totalItems === 0) { start = 0; end = 0; }
        $pageInfo.text(`Showing ${start} to ${end} of ${totalItems} entries`);
    }
    initColumnToggles() {
        const $columnsList = this.toolbarContainer.find(`#columns-list-${this.options.containerId}`);
        $columnsList.empty();
        this.columns.forEach(column => {
            if (column.field !== 'actions') {
                $columnsList.append(`
                    <label class="flex items-center cursor-pointer">
                        <input type="checkbox" class="column-toggle form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" data-field="${column.field}" ${column.visible ? 'checked' : ''}>
                        <span class="ml-2 text-sm text-gray-700">${column.title}</span>
                    </label>
                `);
            }
        });
        this.updateToggleAllCheckboxState();
    }
    updateColumnsVisibility() {
        let allChecked = true;
        this.columns.forEach(column => {
            if (column.field !== 'actions') {
                const checkbox = this.toolbarContainer.find(`.column-toggle[data-field="${column.field}"]`);
                if (checkbox.length > 0) {
                    column.visible = checkbox.prop('checked');
                    if (!column.visible) allChecked = false;
                }
            } else {
                const actionsColumn = this.columns.find(c => c.field === 'actions');
                if (actionsColumn) actionsColumn.visible = true;
            }
        });
        this.toolbarContainer.find(`#toggle-all-columns-${this.options.containerId}`).prop('checked', allChecked);
        this.updateTableHeader();
        const currentData = this.options.serverSide ? this.tableData : this.getCurrentPageData();
        this.updateTableView(currentData);
        this.updateCardView(currentData);
    }
    getCurrentPageData() {
        if (this.pageSize === 'All') {
            return this.filteredData;
        } else {
            const size = parseInt(this.pageSize, 10);
            if (isNaN(size) || size <= 0) return [];
            const start = (this.currentPage - 1) * size;
            return this.filteredData.slice(start, start + size);
        }
    }
    updateToggleAllCheckboxState() {
        const $columnToggles = this.toolbarContainer.find('.column-toggle');
        const allChecked = $columnToggles.length > 0 && $columnToggles.length === $columnToggles.filter(':checked').length;
        this.toolbarContainer.find(`#toggle-all-columns-${this.options.containerId}`).prop('checked', allChecked);
    }
    updateSortIcons() {
        this.tableContainer.find('th[data-sort] i.sort-icon').removeClass('fa-sort-up fa-sort-down text-black').addClass('fa-sort text-gray-500');
        if (this.sortField) {
            const $currentSortHeader = this.tableContainer.find(`th[data-sort="${this.sortField}"]`);
            if ($currentSortHeader.length) {
                $currentSortHeader.find('i.sort-icon')
                    .removeClass('fa-sort text-gray-500')
                    .addClass(this.sortOrder === 'asc' ? 'fa-sort-down' : 'fa-sort-up')
                    .addClass('text-black');
            }
        }
    }
    exportTable(format) {
        const dataToExport = this.options.serverSide ? this.tableData : this.filteredData;
        if (!dataToExport || dataToExport.length === 0) {
            alert("No data available to export.");
            return;
        }
        const filename = `table-export-${this.options.containerId}-${new Date().toISOString().split('T')[0]}`;
        const visibleColumns = this.columns.filter(col => col.visible && col.field !== 'actions');
        const exportData = dataToExport.map(item => {
            const rowData = {};
            visibleColumns.forEach(col => {
                rowData[col.title] = item[col.field];
            });
            return rowData;
        });
        try {
            if (format === 'csv') {
                if (typeof XLSX === 'undefined' || typeof saveAs === 'undefined') throw new Error("Export library not loaded.");
                const worksheet = XLSX.utils.json_to_sheet(exportData);
                const csvContent = XLSX.utils.sheet_to_csv(worksheet);
                const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
                saveAs(blob, `${filename}.csv`);
            } else if (format === 'xlsx') {
                if (typeof XLSX === 'undefined' || typeof saveAs === 'undefined') throw new Error("Export library not loaded.");
                const worksheet = XLSX.utils.json_to_sheet(exportData);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
                XLSX.writeFile(workbook, `${filename}.xlsx`);
            } else if (format === 'json') {
                if (typeof saveAs === 'undefined') throw new Error("FileSaver library not loaded.");
                const jsonContent = JSON.stringify(exportData, null, 2);
                const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
                saveAs(blob, `${filename}.json`);
            }
        } catch (e) {
            console.error("Export failed:", e);
            alert(`Export failed: ${e.message}. Make sure export libraries are loaded correctly.`);
        }
    }
    convertToCSV(data) { return ''; }
    addEventListeners() {
        const containerId = this.options.containerId;
        const eventNamespace = `.tablecomponent.${containerId}`;
        this.container.off(eventNamespace);
        this.toolbarContainer?.off(eventNamespace);
        this.tableContainer?.off(eventNamespace);
        this.footerContainer?.off(eventNamespace);
        $(document).off(eventNamespace);
        this.toolbarContainer.on(`click${eventNamespace}`, `#refresh-${containerId}`, () => this.fetchData());
        this.toolbarContainer.on(`click${eventNamespace}`, `#toggle-${containerId}`, () => this.toggleViewMode());
        this.toolbarContainer.on(`click${eventNamespace}`, `#fullscreen-${containerId}`, () => this.toggleFullscreen());
        let searchTimeout;
        this.toolbarContainer.on(`input${eventNamespace}`, `#search-${containerId}`, (event) => {
            clearTimeout(searchTimeout);
            const searchTerm = $(event.currentTarget).val();
            searchTimeout = setTimeout(() => {
                this.currentSearchTerm = searchTerm;
                this.currentPage = 1;
                if (this.options.serverSide) { this.fetchData(); } else { this.updateTable(); }
            }, 300);
        });
        this.tableContainer.on(`click${eventNamespace}`, `th[data-sort]`, (event) => {
            const field = $(event.currentTarget).data('sort');
            if (this.sortField === field) { this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc'; }
            else { this.sortField = field; this.sortOrder = 'asc'; }
            this.currentPage = 1;
            if (this.options.serverSide) { this.fetchData(); } else { this.updateTable(); }
        });
        this.toolbarContainer.on(`change${eventNamespace}`, `#toggle-all-columns-${containerId}`, (event) => {
            const isChecked = $(event.target).prop('checked');
            this.toolbarContainer.find('.column-toggle').prop('checked', isChecked);
            this.updateColumnsVisibility();
        });
        this.toolbarContainer.on(`change${eventNamespace}`, '.column-toggle', () => {
            this.updateColumnsVisibility();
            this.updateToggleAllCheckboxState();
        });
        this.toolbarContainer.on(`click${eventNamespace}`, `#export-dropdown-${containerId} [data-export]`, (event) => {
            const format = $(event.currentTarget).data('export');
            this.exportTable(format);
            const dropdownElement = document.getElementById(`export-dropdown-${containerId}`);
            if (dropdownElement && typeof Dropdown !== 'undefined' && typeof Dropdown.getInstance === 'function') {
                const dropdownInstance = Dropdown.getInstance(dropdownElement);
                dropdownInstance?.hide();
            } else { $(dropdownElement).addClass('hidden'); }
        });
        this.footerContainer.on(`change${eventNamespace}`, `#page-size-${containerId}`, (event) => {
            const newSize = $(event.currentTarget).val();
            this.pageSize = newSize === 'All' ? 'All' : parseInt(newSize, 10);
            this.currentPage = 1;
            if (this.options.serverSide) { this.fetchData(); } else { this.updateTable(); }
        });
        this.footerContainer.on(`click${eventNamespace}`, `#prev-page-${containerId}`, () => {
            if (this.currentPage > 1) { this.currentPage--; if (this.options.serverSide) { this.fetchData(); } else { this.updateTable(); } }
        });
        this.footerContainer.on(`click${eventNamespace}`, `#next-page-${containerId}`, () => {
            const currentTotal = this.options.serverSide ? this.totalItems : this.filteredData.length;
            const numericPageSize = this.pageSize === 'All' ? currentTotal : parseInt(this.pageSize, 10);
            if (isNaN(numericPageSize) || numericPageSize <= 0) return;
            const totalPages = this.pageSize === 'All' ? 1 : Math.ceil(currentTotal / numericPageSize);
            if (this.currentPage < totalPages) { this.currentPage++; if (this.options.serverSide) { this.fetchData(); } else { this.updateTable(); } }
        });
        this.footerContainer.on(`click${eventNamespace}`, '.page-number', (event) => {
            const page = parseInt($(event.currentTarget).data('page'), 10);
            if (!isNaN(page) && page !== this.currentPage) { this.currentPage = page; if (this.options.serverSide) { this.fetchData(); } else { this.updateTable(); } }
        });
        this.footerContainer.on(`change${eventNamespace}`, `#toggle-pagination-${containerId}`, (event) => {
            this.options.showPagination = $(event.currentTarget).prop('checked');
            this.updatePagination(this.options.serverSide ? this.totalItems : this.filteredData.length);
        });
        this.container.on(`change${eventNamespace}`, `#select-all-${containerId}`, this.handleSelectAllChange.bind(this));
        this.container.on(`change${eventNamespace}`, '.row-checkbox', this.handleRowCheckboxChange.bind(this));
        if (this.options.enableDelete) {
            this.toolbarContainer.on(`click${eventNamespace}`, `#remove-${containerId}`, () => this.handleMultipleDelete());
        }
        this.container.on(`click${eventNamespace}`, '[data-modal-target]', (event) => {
            const $button = $(event.currentTarget);
            const modalTargetId = $button.data('modal-target');
            const itemId = $button.data('item-id');
            if (modalTargetId === this.deleteModalId && itemId !== undefined) {
                this.itemToDelete = parseInt(itemId, 10);
                this.deleteModal?.show();
            } else if (modalTargetId === this.editModalId && itemId !== undefined) {
                this.openEditModal(itemId);
            }
        });
        $(document).on(`click${eventNamespace}`, `#${this.deleteModalId} .modal-close-button`, (event) => {
            event.preventDefault();
            this.deleteModal?.hide();
        });
        $(document).on(`click${eventNamespace}`, `#confirm-delete-${this.deleteModalId}`, () => {
            this.handleConfirmDelete();
        });
        $(document).on(`click${eventNamespace}`, `#${this.editModalId} .modal-close-button`, (event) => {
            event.preventDefault();
            this.editModal?.hide();
        });
        $(document).on(`click${eventNamespace}`, `#save-edit-${this.editModalId}`, () => {
            this.saveEdit();
        });
    }
    handleRowSelectionChange(id, isChecked) {
        const itemId = parseInt(id, 10);
        if (isNaN(itemId)) return;
        if (isChecked) {
            if (!this.selections.includes(itemId)) {
                this.selections.push(itemId);
            }
        } else {
            this.selections = this.selections.filter(selectedId => selectedId !== itemId);
        }
        this.container.find(`tr[data-id="${itemId}"]`).toggleClass('row-selected bg-blue-100', isChecked);
        this.container.find(`.card[data-id="${itemId}"]`).toggleClass('row-selected border-blue-300 ring-2 ring-blue-200', isChecked);
        this.updateRemoveButtonState();
        this.updateSelectAllCheckboxState(this.options.serverSide ? this.tableData : this.getCurrentPageData());
    }
    handleSelectAllChange(event) {
        const isChecked = $(event.target).prop('checked');
        const currentlyVisibleData = this.options.serverSide ? this.tableData : this.getCurrentPageData();
        currentlyVisibleData.forEach(item => {
            const itemId = item.id;
            if (itemId !== undefined) {
                const numericId = parseInt(itemId, 10);
                if (isNaN(numericId)) return;
                const $itemCheckbox = this.container.find(`.row-checkbox[data-id="${numericId}"]`);
                if (isChecked) {
                    if (!this.selections.includes(numericId)) this.selections.push(numericId);
                    if (!$itemCheckbox.prop('checked')) $itemCheckbox.prop('checked', true);
                    this.container.find(`tr[data-id="${numericId}"]`).addClass('row-selected bg-blue-100');
                    this.container.find(`.card[data-id="${numericId}"]`).addClass('row-selected border-blue-300 ring-2 ring-blue-200');
                } else {
                    this.selections = this.selections.filter(selId => selId !== numericId);
                    if ($itemCheckbox.prop('checked')) $itemCheckbox.prop('checked', false);
                    this.container.find(`tr[data-id="${numericId}"]`).removeClass('row-selected bg-blue-100');
                    this.container.find(`.card[data-id="${numericId}"]`).removeClass('row-selected border-blue-300 ring-2 ring-blue-200');
                }
            }
        });
        this.updateRemoveButtonState();
        this.updateSelectAllCheckboxState(currentlyVisibleData);
    }
    handleRowCheckboxChange(event) {
        const $checkbox = $(event.target);
        const id = $checkbox.data('id');
        const isChecked = $checkbox.prop('checked');
        if (id !== undefined) {
            this.handleRowSelectionChange(id, isChecked);
        }
    }
    updateSelectAllCheckboxState(renderedData) {
        const $selectAllCheckbox = this.container.find(`#select-all-${this.options.containerId}`);
        if (!$selectAllCheckbox.length) return;
        const renderedIds = renderedData.map(item => item.id).filter(id => id !== undefined).map(id => parseInt(id, 10));
        if (renderedIds.length === 0) {
            $selectAllCheckbox.prop('checked', false);
            $selectAllCheckbox.prop('indeterminate', false);
            return;
        }
        const validRenderedIds = renderedIds.filter(id => !isNaN(id));
        const numSelected = validRenderedIds.filter(id => this.selections.includes(id)).length;
        const allRenderedSelected = validRenderedIds.length > 0 && numSelected === validRenderedIds.length;
        const someRenderedSelected = numSelected > 0 && numSelected < validRenderedIds.length;
        $selectAllCheckbox.prop('checked', allRenderedSelected);
        $selectAllCheckbox.prop('indeterminate', someRenderedSelected);
    }
    updateRemoveButtonState() {
        if (this.options.enableDelete) {
            this.toolbarContainer.find(`#remove-${this.options.containerId}`).prop('disabled', this.selections.length === 0);
        }
    }
    toggleFullscreen() {
        const elem = this.container[0];
        if (!document.fullscreenElement) {
            const promise = elem.requestFullscreen ? elem.requestFullscreen() : (elem.webkitRequestFullscreen ? elem.webkitRequestFullscreen() : (elem.msRequestFullscreen ? elem.msRequestFullscreen() : null));
            if (promise) promise.catch(err => console.error(`Fullscreen error: ${err.message} (${err.name})`));
        } else {
            const promise = document.exitFullscreen ? document.exitFullscreen() : (document.webkitExitFullscreen ? document.webkitExitFullscreen() : (document.msExitFullscreen ? document.msExitFullscreen() : null));
            if (promise) promise.catch(err => console.error(`Exit Fullscreen error: ${err.message} (${err.name})`));
        }
    }
    toggleViewMode() {
        this.viewMode = this.viewMode === 'table' ? 'card' : 'table';
        this.tableContainer.toggleClass('hidden', this.viewMode !== 'table');
        this.cardContainer.toggleClass('hidden', this.viewMode !== 'card');
        const $toggleButton = this.toolbarContainer.find(`#toggle-${this.options.containerId} i`);
        if (this.viewMode === 'card') {
            $toggleButton.removeClass('fa-table').addClass('fa-list');
        } else {
            $toggleButton.removeClass('fa-list').addClass('fa-table');
        }
        this.updateSelectionStyles();
        this.updateSelectAllCheckboxState(this.options.serverSide ? this.tableData : this.getCurrentPageData());
    }
    updateSelectionStyles() {
        this.container.find('tr.row-selected').removeClass('row-selected bg-blue-100');
        this.container.find('.card.row-selected').removeClass('row-selected border-blue-300 ring-2 ring-blue-200');
        this.selections.forEach(id => {
            const numericId = parseInt(id, 10);
            if (isNaN(numericId)) return;
            this.container.find(`tr[data-id="${numericId}"]`).addClass('row-selected bg-blue-100');
            this.container.find(`.card[data-id="${numericId}"]`).addClass('row-selected border-blue-300 ring-2 ring-blue-200');
        });
    }
    createDeleteModal() {
        if ($(`#${this.deleteModalId}`).length > 0) return;
        const modalHtml = `
           <div id="${this.deleteModalId}" tabindex="-1" aria-hidden="true" class="hidden overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full">
               <div class="relative p-4 w-full max-w-md max-h-full">
                   <div class="relative bg-white rounded-lg shadow-xl border border-gray-300">
                       <button type="button" class="modal-close-button absolute top-3 end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center">
                           <svg class="w-3 h-3" aria-hidden="true" xmlns="http:
                               <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                           </svg>
                           <span class="sr-only">Close modal</span>
                       </button>
                       <div class="p-4 md:p-5 text-center">
                           <svg class="mx-auto mb-4 text-gray-400 w-12 h-12" aria-hidden="true" xmlns="http:
                               <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                           </svg>
                           <h3 class="mb-5 text-lg font-normal text-gray-700">Are you sure you want to delete this item?</h3>
                           <button id="confirm-delete-${this.deleteModalId}" type="button" class="text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center me-2">
                               Yes, I'm sure
                           </button>
                           <button type="button" class="modal-close-button text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10">No, cancel</button>
                       </div>
                   </div>
               </div>
           </div>
       `;
        $('body').append(modalHtml);
    }
    handleConfirmDelete() {
        if (this.itemToDelete !== null) {
            const idToDelete = this.itemToDelete;
            this.deleteModal?.hide();
            if (this.options.serverSide) {
                console.log(`TODO: Send DELETE request for ID ${idToDelete} to server.`);
                this.showLoading();
                setTimeout(() => {
                    this.itemToDelete = null;
                    this.selections = this.selections.filter(id => id !== idToDelete);
                    this.fetchData();
                    this.updateRemoveButtonState();
                }, 300);
            }
            else {
                this.tableData = this.tableData.filter(item => item.id !== idToDelete);
                this.selections = this.selections.filter(id => id !== idToDelete);
                this.itemToDelete = null;
                this.updateTable();
                this.updateRemoveButtonState();
            }
        } else {
            this.deleteModal?.hide();
        }
    }
    handleMultipleDelete() {
        if (this.selections.length === 0) return;
        if (!confirm(`Are you sure you want to delete ${this.selections.length} selected item(s)?`)) return;
        const idsToDelete = [...this.selections];
        if (this.options.serverSide) {
            console.log(`TODO: Send BULK DELETE request for IDs ${idsToDelete.join(', ')} to server.`);
            this.showLoading();
            setTimeout(() => {
                this.selections = [];
                this.fetchData();
                this.updateRemoveButtonState();
            }, 500);
        }
        else {
            this.tableData = this.tableData.filter(item => !idsToDelete.includes(item.id));
            this.selections = [];
            this.updateTable();
            this.updateRemoveButtonState();
            this.updateSelectAllCheckboxState(this.getCurrentPageData());
        }
    }
    createEditModal() {
        if ($(`#${this.editModalId}`).length > 0) return;
        const modalHtml = `
         <div id="${this.editModalId}" tabindex="-1" aria-hidden="true" class="hidden overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full">
             <div class="relative p-4 w-full max-w-2xl max-h-full">
                 <div class="relative bg-white rounded-lg shadow-xl border border-gray-300">
                     <div class="flex items-center justify-between p-4 md:p-5 border-b rounded-t">
                         <h3 class="text-lg font-semibold text-gray-900">
                             Edit Item
                         </h3>
                         <button type="button" class="modal-close-button text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center">
                             <svg class="w-3 h-3" aria-hidden="true" xmlns="http:
                                 <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                             </svg>
                             <span class="sr-only">Close modal</span>
                         </button>
                     </div>
                     <form id="edit-form-${this.editModalId}" class="p-4 md:p-5 space-y-4">
                         <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 edit-form-fields">
                            <!-- Form fields will be injected here -->
                         </div>
                     </form>
                     <div class="flex items-center p-4 md:p-5 border-t border-gray-200 rounded-b">
                         <button id="save-edit-${this.editModalId}" type="button" class="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center">Save Changes</button>
                         <button type="button" class="modal-close-button ms-3 text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10">Cancel</button>
                     </div>
                 </div>
             </div>
         </div>
       `;
        $('body').append(modalHtml);
    }
    openEditModal(id) {
        const numericId = parseInt(id, 10);
        if (isNaN(numericId)) {
            console.error("Invalid ID passed to openEditModal:", id);
            return;
        }
        this.editedItemId = numericId;
        const item = this.tableData.find(item => item.id === this.editedItemId);
        if (!item) {
            if (this.options.serverSide) {
                console.warn(`Item ID ${this.editedItemId} not found in current page data (server-side). Feature requires fetching item data.`);
                alert("Cannot edit item not on current page (Feature Placeholder).");
                return;
            } else {
                console.warn("Item not found for editing (client-side):", this.editedItemId);
                alert("Could not find the item to edit.");
                return;
            }
        }
        const populateModal = (itemData) => {
            const $formFieldsContainer = $(`#edit-form-${this.editModalId} .edit-form-fields`);
            $formFieldsContainer.empty();
            const editableColumns = this.columns.filter(column => column.field !== 'actions' && column.field !== 'id');
            editableColumns.forEach(column => {
                const value = itemData[column.field] ?? '';
                const fieldId = `edit-${this.options.containerId}-${column.field}`;
                const escapedValue = $('<textarea />').text(value).html();
                $formFieldsContainer.append(`
                       <div class="col-span-1">
                           <label for="${fieldId}" class="block mb-1 text-sm font-medium text-gray-700">${column.title}</label>
                           <input type="text" id="${fieldId}" name="${column.field}" value="${escapedValue}"
                             class="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                       </div>
                 `);
            });
            this.editModal?.show();
        };
        populateModal(item);
    }
    saveEdit() {
        if (this.editedItemId === null) return;
        const itemIndex = this.tableData.findIndex(item => item.id === this.editedItemId);
        const $form = $(`#edit-form-${this.editModalId}`);
        const updatedData = {};
        const editableColumns = this.columns.filter(column => column.field !== 'actions' && column.field !== 'id');
        editableColumns.forEach(column => {
            const fieldId = `edit-${this.options.containerId}-${column.field}`;
            updatedData[column.field] = $form.find(`#${fieldId}`).val();
        });
        this.editModal?.hide();
        if (this.options.serverSide) {
            console.log(`TODO: Send PUT/PATCH request for ID ${this.editedItemId} with data:`, updatedData);
            this.showLoading();
            setTimeout(() => {
                this.editedItemId = null;
                this.fetchData();
            }, 300);
        }
        else {
            if (itemIndex !== -1) {
                this.tableData[itemIndex] = { ...this.tableData[itemIndex], ...updatedData };
                this.editedItemId = null;
                this.updateTable();
            } else {
                console.error("Item not found for saving edit (client-side):", this.editedItemId);
                alert("Error: Could not find the item to save.");
                this.editedItemId = null;
            }
        }
    }
    destroy() {
        console.log(`Destroying TableComponent: ${this.options.containerId}`);
        const eventNamespace = `.tablecomponent.${this.options.containerId}`;
        $(document).off(eventNamespace);
        this.container?.off(eventNamespace);
        this.toolbarContainer?.off(eventNamespace);
        this.tableContainer?.off(eventNamespace);
        this.footerContainer?.off(eventNamespace);
        this.editModal?.destroy();
        this.deleteModal?.destroy();
        this.editModal = null;
        this.deleteModal = null;
        $(`#${this.deleteModalId}`).remove();
        $(`#${this.editModalId}`).remove();
        this.container?.empty();
        this.tableData = [];
        this.filteredData = [];
        this.columns = [];
        this.selections = [];
        if (window.tableComponentInstances && window.tableComponentInstances[this.options.containerId]) {
            delete window.tableComponentInstances[this.options.containerId];
        }
    }
}