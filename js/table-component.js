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
        };

        this.tableData = [];
        this.filteredData = [];
        this.currentPage = 1;
        this.pageSize = this.options.defaultPageSize;
        this.sortField = null;
        this.sortOrder = 'asc';
        this.selections = [];
        this.viewMode = 'table';
        this.totalItems = 0;
        this.isLoading = false;
        this.columns = [];
        this.editedData = {};
        this.deleteModalId = `delete-modal-${this.options.containerId}`; // Unique ID
        this.editModalId = 'edit-modal-container'; // Consistent ID
        this.deleteModal = null; // Flowbite modal instance
        this.editModal = null;     // Flowbite modal instance


        this.container = $('#' + this.options.containerId);
        this.toolbarContainer = null;
        this.tableContainer = null;
        this.cardContainer = null;
        this.footerContainer = null;
        this.itemToDelete = null;//for delete

        this.loadLibraries().then(() => {
            this.init();
            this.createEditModal();
            this.createDeleteModal();

            // DOMContentLoaded and setTimeout for Flowbite init
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => {
                    if (window.flowbite && typeof window.flowbite.initFlowbite === 'function') {
                        window.flowbite.initFlowbite();
                    }
                }, 0);
            });
        });
    }

    async loadLibraries() {
        await this.loadScript('js/axios.min.js');

        if (this.options.enableExportDropdown) {
            await this.loadScript('/js/xlsx.full.min.js');
            await this.loadScript('/js/FileSaver.min.js');
        }
    }
    loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    loadStyleSheet(href) {
        return new Promise((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.onload = resolve;
            link.onerror = reject;
            document.head.appendChild(link);
        });
    }

    init() {
        this.createToolbarHtml();
        this.createBaseHtml();
        this.createFooterHtml();
        this.fetchData();
        this.addEventListeners();
    }
    createToolbarHtml() {
        const toolbarId = `toolbar-component-${this.options.containerId}`;
        this.toolbarContainer = $(`<div id="${toolbarId}" class="table-toolbar"></div>`);
        this.container.append(this.toolbarContainer);

        let html = `
             <div class="flex flex-wrap justify-between items-center mb-4">
                 ${this.options.enableDelete ? `
                 <div>
                     <button id="remove" title="Delete"
                         class="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-opacity-50 transition-colors">
                         <i class="fa fa-trash"></i>
                     </button>
                 </div>` : ''}
 
                 <div class="flex flex-wrap items-center gap-3">
                     ${this.options.enableSearch ? `
                     <div class="relative w-48 md:w-64">
                         <label for="search" class="sr-only">Search</label>
                         <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                             <i class="fa fa-search text-gray-600"></i>
                         </div>
                         <input id="search" type="text" placeholder="Search..."
                             class="block w-full pl-10 pr-3 py-2 border border-gray-400 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 sm:text-sm">
                     </div>` : ''}
 
                     <div class="inline-flex rounded-md shadow-sm" role="group">
                         ${this.options.enableRefresh ? `
                         <button id="refresh" title="Refresh" data-action-id="refresh"
                             class="text-gray-700 bg-gray-200 hover:bg-gray-300 focus:bg-gray-300 px-4 py-2 focus:outline-none transition-colors border-x border-l rounded-l-lg border-gray-400">
                             <i class="fa fa-sync-alt"></i>
                         </button>` : ''}
 
                         ${this.options.enableViewToggle ? `
                         <button id="toggle" title="Toggle View" data-action-id="toggle-view"
                             class="text-gray-700 bg-gray-200 hover:bg-gray-300 focus:bg-gray-300 px-4 py-2 focus:outline-none transition-colors border-r border-gray-400">
                             <i class="fa fa-table"></i>
                         </button>` : ''}
 
                         ${this.options.enableFullscreen ? `
                         <button id="fullscreen" title="Fullscreen"  data-action-id="fullscreen"
                             class="text-gray-700 bg-gray-200 hover:bg-gray-300 focus:bg-gray-300 px-4 py-2 focus:outline-none transition-colors border-r border-gray-400">
                             <i class="fa fa-expand"></i>
                         </button>` : ''}
 
                         ${this.options.enableColumnsDropdown ? `
                         <div class="relative dropdown">
                             <button id="columns-dropdown-button" title="Columns" data-dropdown-toggle="columns-dropdown"
                                 class="text-gray-700 bg-gray-200 hover:bg-gray-300 focus:bg-gray-300 px-4 py-2 focus:outline-none transition-colors border-r border-gray-400">
                                 <i class="fa fa-columns mr-1"></i>
                                 <i class="fa fa-caret-down ml-1"></i>
                             </button>
                             <div id="columns-dropdown"
                                 class="dropdown-content hidden absolute z-10 bg-white shadow-lg rounded-lg mt-1 p-2 border border-gray-300 w-48">
                                 <div class="mb-2">
                                     <label class="inline-flex items-center">
                                         <input type="checkbox" id="toggle-all-columns"
                                             class="form-checkbox h-4 w-4 text-blue-600" checked>
                                         <span class="ml-2 text-sm text-gray-700">Toggle All</span>
                                     </label>
                                 </div>
                                 <hr class="my-2 border-gray-300">
                                 <div id="columns-list" class="space-y-2">
                                 </div>
                             </div>
                         </div>` : ''}
 
                         ${this.options.enableExportDropdown ? `
                         <div class="relative dropdown">
                             <button id="export-dropdown-button" title="Export" data-dropdown-toggle="export-dropdown"
                                 class="text-gray-700 bg-gray-200 hover:bg-gray-300 focus:bg-gray-300 px-4 py-2 focus:outline-none transition-colors border-r rounded-r-lg border-gray-400">
                                 <i class="fa fa-download mr-1"></i>
                                 <i class="fa fa-caret-down ml-1"></i>
                             </button>
                             <div id="export-dropdown"
                                 class="dropdown-content hidden absolute z-10 bg-white shadow-lg rounded-lg mt-1 p-2 border border-gray-300 w-48 right-0">
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
        this.tableContainer = $(`<div id="${tableId}" class="table-component"></div>`);
        this.container.append(this.tableContainer);

        let html = `
             <div class="relative overflow-x-auto shadow-lg sm:rounded-lg mt-5">
                 <div class="loading-overlay hidden">
                     <i class="fa fa-spinner fa-spin fa-3x fa-fw text-blue-600"></i>
                 </div>
                 <table id="data-table" class="w-full text-sm text-left text-gray-600">
                     <thead class="text-xs text-gray-700 uppercase bg-gray-300">
                     </thead>
                     <tbody>
                     </tbody>
                     <tfoot>
                     </tfoot>
                 </table>
             </div>
         `;
        this.tableContainer.html(html);

        this.cardContainer = $(`<div id="card-container-${this.options.containerId}" class="w-full hidden grid grid-cols-[repeat(auto-fill,_minmax(320px,_1fr))] gap-6 mt-6"></div>`);
        this.container.append(this.cardContainer);

        if (!window.tableComponentInstances) {
            window.tableComponentInstances = {};
        }
        window.tableComponentInstances[this.options.containerId] = this;
    }

    createFooterHtml() {
        const footerId = `footer-component-${this.options.containerId}`;
        this.footerContainer = $(`<div id="${footerId}" class="table-footer"></div>`);
        this.container.append(this.footerContainer);

        let html = `
             <div class="flex flex-wrap justify-between items-center mt-8">
                 <div>
                     <label for="page-size" class="mr-2 text-sm font-medium text-gray-700">Items per page:</label>
                     <select id="page-size" class="bg-white border border-gray-400 text-gray-900 text-sm rounded-lg focus:ring-blue-600 focus:border-blue-600">
                         ${this.options.pageSizeOptions.map(size => `<option value="${size}" ${size === this.pageSize ? 'selected' : ''}>${size}</option>`).join('')}
                     </select>
                 </div>
 
                 <div class="flex items-center mt-4 sm:mt-0">
                     <label class="mr-3 text-sm font-medium text-gray-700">
                         <input type="checkbox" id="toggle-pagination" class="mr-1" ${this.options.showPagination ? 'checked' : ''}>
                         Show Pagination
                     </label>
 
                     <nav aria-label="Page navigation" class="pagination-container">
                         <ul class="inline-flex -space-x-px text-sm">
                             <li>
                                 <button id="prev-page" class="flex items-center justify-center px-3 h-8 ml-0 leading-tight text-gray-600 bg-white border border-gray-400 rounded-l-lg hover:bg-gray-200 hover:text-gray-700 transition-colors duration-200">
                                     <i class="fa fa-chevron-left"></i>
                                 </button>
                             </li>
                             <li id="pagination-numbers">
                             </li>
                             <li>
                                 <button id="next-page" class="flex items-center justify-center px-3 h-8 leading-tight text-gray-600 bg-white border border-gray-400 rounded-r-lg hover:bg-gray-200 hover:text-gray-700 transition-colors duration-200">
                                     <i class="fa fa-chevron-right"></i>
                                 </button>
                             </li>
                         </ul>
                     </nav>
                 </div>
             </div>
 
             <div class="text-sm text-gray-600 mt-4" id="page-info">
                 Showing 0 to 0 of 0 entries
             </div>
         `;
        this.footerContainer.html(html);
    }

    showLoading() { this.isLoading = true; this.tableContainer.find('.loading-overlay').removeClass('hidden'); }
    hideLoading() { this.isLoading = false; this.tableContainer.find('.loading-overlay').addClass('hidden'); }

    naturalSort(a, b) {
        const ax = [], bx = [];
        a.replace(/(\d+)|(\D+)/g, function (_, $1, $2) { ax.push([$1 || Infinity, $2 || ""]) });
        b.replace(/(\d+)|(\D+)/g, function (_, $1, $2) { bx.push([$1 || Infinity, $2 || ""]) });
        while (ax.length && bx.length) {
            const an = ax.shift();
            const bn = bx.shift();
            const nn = (an[0] - bn[0]) || an[1].localeCompare(bn[1]);
            if (nn) return nn;
        }
        return ax.length - bx.length;
    }

    fetchData() {
        this.showLoading();
        axios.get(this.options.dataUrl)
            .then(response => {
                if (response.data && response.data.rows && Array.isArray(response.data.rows)) {
                    this.tableData = response.data.rows;
                    this.totalItems = response.data.total;

                    if (this.tableData.length > 0) {
                        this.columns = Object.keys(this.tableData[0]).map(key => ({
                            field: key,
                            title: key.charAt(0).toUpperCase() + key.slice(1),
                            sortable: true,
                            visible: true
                        }));
                        if (this.options.customActions.length > 0) {
                            this.columns.push({ field: 'actions', title: "Actions", sortable: false, visible: true });
                        }
                    }
                    this.initColumnToggles();
                    this.updateTable();
                } else {
                    console.error('Invalid data format received:', response.data);
                    this.tableContainer.find('#data-table tbody').html(`<tr><td colspan="${this.columns.length || 1}" class="text-center text-red-600">Invalid data format received.</td></tr>`);
                }
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                let colspan = this.columns.length > 0 ? this.columns.length : 1;
                this.tableContainer.find('#data-table tbody').html(`<tr><td colspan="${colspan}" class="text-center text-red-600">Error loading data: ${error.message}</td></tr>`);
            })
            .finally(() => this.hideLoading());
    }

    updateTable() {
        const searchInput = this.toolbarContainer.find('#search');
        const searchTerm = (searchInput.length > 0 && searchInput.val()) ? searchInput.val().toLowerCase() : '';

        this.filteredData = searchTerm
            ? this.tableData.filter(item =>
                this.columns.some(col => {
                    const value = item[col.field];
                    if (value === null || value === undefined) {
                        return false;
                    }
                    const stringValue = String(value);
                    return stringValue.toLowerCase().includes(searchTerm);
                })
            )
            : [...this.tableData];

        if (this.sortField) {
            this.filteredData.sort((a, b) => {
                const aVal = String(a[this.sortField] ?? '');
                const bVal = String(b[this.sortField] ?? '');
                return this.naturalSort(aVal, bVal) * (this.sortOrder === 'asc' ? 1 : -1);
            });
        }

        const paginatedData = this.pageSize === 'All' ? [...this.filteredData] : this.filteredData.slice((this.currentPage - 1) * this.pageSize, this.currentPage * this.pageSize);

        this.updateTableView(paginatedData);
        this.updateCardView(paginatedData);
        this.updatePagination();
        this.updatePageInfo();
        this.updateSortIcons();
        this.updateTableHeader();
    }
    createActionButton(action, item) {
        let buttonHtml = '';
        const actionId = action.modalId || action.type;

        if (action.type === 'button') {
            buttonHtml = `<button data-item-id="${item.id}" data-action-id="${actionId}"  data-modal-target="${this.editModalId}" data-modal-toggle="${this.editModalId}" class="${action.class}" ${action.attributes || ''}>${action.icon ? `<i class="${action.icon}"></i> ` : ''}${action.label}</button>`;
        } else if (action.type === 'modal') {
            buttonHtml = `<button data-item-id="${item.id}" data-modal-target="${this.deleteModalId}" data-modal-toggle="${this.deleteModalId}" class="${action.class}" type="button">
            ${action.icon ? `<i class="${action.icon}"></i> ` : ''}${action.label}
        </button>`;
        }
        return buttonHtml;
    }


    updateTableView(data) {
        const $tbody = this.tableContainer.find('#data-table tbody');
        $tbody.empty();

        if (data.length === 0) {
            $tbody.append(`<tr><td colspan="${this.columns.length}" class="text-center text-gray-600">No data available</td></tr>`);
            return;
        }

        data.forEach(item => {
            const row = $(`<tr class="bg-white border-b hover:bg-gray-100 transition duration-150 ease-in-out ${this.selections.includes(item.id) ? 'row-selected bg-blue-100' : ''}" data-id="${item.id}"></tr>`);
            row.append(`<td class="px-4 py-3 w-12"><input type="checkbox" class="row-checkbox w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-600" data-id="${item.id}" ${this.selections.includes(item.id) ? 'checked' : ''}></td>`);

            this.columns.forEach(column => {
                if (column.field !== 'actions' && column.visible) {
                    const cellValue = item[column.field] === null || item[column.field] === undefined ? '' : item[column.field];
                    // Use a data attribute to store the field name for easy hiding/showing
                    row.append(`<td class="px-6 py-3" data-field="${column.field}">${cellValue}</td>`);
                }
            });

            if (this.columns.some(c => c.field === 'actions')) {
                let actionsHtml = '<td class="px-6 py-3 space-x-2">';
                this.options.customActions.forEach(action => {
                    actionsHtml += this.createActionButton(action, item);
                });
                actionsHtml += '</td>';
                row.append(actionsHtml);
            }

            $tbody.append(row);

            //Detail Row (no changes)
            const detailRow = $(`<tr class="hidden detail-row bg-gray-50" data-id="${item.id}"><td colspan="${this.columns.length}" class="px-6 py-4"></td></tr>`);
            const detailContainer = $(`<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>`);
            this.columns.forEach(column => {
                if (column.field !== 'actions') {
                    const cellValue = item[column.field] === null || item[column.field] === undefined ? '' : item[column.field];
                    detailContainer.append(`<div><strong class="text-gray-700">${column.title}:</strong> ${cellValue}</div>`);
                }
            });
            detailRow.find('td').append(detailContainer);
            $tbody.append(detailRow);
        });
    }

    updateCardView(data) {
        const $cardContainer = this.cardContainer;
        $cardContainer.empty();

        if (data.length === 0) {
            $cardContainer.append(`<div class="text-center text-gray-600">No data available</div>`);
            return;
        }

        data.forEach(item => {
            const card = $(`
                <div class="card bg-white rounded-lg shadow-md p-4 border border-gray-300 relative animate-slide-in-up" data-id="${item.id}">
                    <div class="flex justify-end">
                        <input type="checkbox" class="row-checkbox card-checkbox w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-600"
                            data-id="${item.id}" ${this.selections.includes(item.id) ? 'checked' : ''}>
                    </div>
                    <table class="w-full">
                        <tbody>
                            ${this.columns.filter(c => c.field !== 'actions' && c.visible).map(column => {
                const cellValue = item[column.field] === null || item[column.field] === undefined ? '' : item[column.field];
                return `
                                    <tr>
                                        <th class="text-left font-semibold text-gray-700 py-2 pr-4">${column.title}</th>
                                        <td class="py-2" data-field="${column.field}">${cellValue}</td>
                                    </tr>`;
            }).join('')}
                        </tbody>
                    </table>
                    <div class="flex justify-end space-x-2 mt-4">
                        ${this.options.customActions.map(action => this.createActionButton(action, item)).join('')}
                    </div>
                </div>
            `);
            $cardContainer.append(card);
        });
    }

    updateTableHeader() {
        const $thead = this.tableContainer.find('#data-table thead');
        $thead.empty();

        if (this.columns.length === 0) return;

        const headerRow = $('<tr></tr>');
        headerRow.append(`<th scope="col" class="px-4 py-3 w-12"><input id="select-all" type="checkbox" class="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-600"></th>`);

        this.columns.forEach(column => {
            if (column.visible) {
                headerRow.append(column.sortable
                    ? `<th scope="col" class="px-6 py-3 cursor-pointer" data-sort="${column.field}" data-field="${column.field}"><span class="flex items-center">${column.title} <i class="fa fa-sort ml-1 sort-icon"></i></span></th>`
                    : `<th scope="col" class="px-6 py-3"  data-field="${column.field}">${column.title}</th>`
                );
            }
        });

        $thead.append(headerRow);
        this.updateSortIcons();
    }

    updatePagination() {
        const $paginationContainer = this.footerContainer.find('.pagination-container');
        const $paginationNumbers = this.footerContainer.find('#pagination-numbers');

        $paginationContainer.toggle(this.options.showPagination);
        if (!this.options.showPagination) return;

        $paginationNumbers.empty();
        const totalPages = this.pageSize === 'All' ? 1 : Math.ceil(this.filteredData.length / this.pageSize);
        this.footerContainer.find('#prev-page').prop('disabled', this.currentPage === 1);
        this.footerContainer.find('#next-page').prop('disabled', this.currentPage === totalPages);

        let startPage = Math.max(1, this.currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);

        if (startPage > 1) {
            $paginationNumbers.append(`<button class="page-number px-3 h-8 leading-tight text-gray-600 bg-white border border-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors duration-200" data-page="1">1</button>`);
            if (startPage > 2) $paginationNumbers.append(`<span class="px-3 h-8 leading-tight text-gray-600">...</span>`);
        }

        for (let i = startPage; i <= endPage; i++) {
            $paginationNumbers.append(`<button class="page-number px-3 h-8 leading-tight ${i === this.currentPage ? 'text-blue-600 bg-blue-100 border border-blue-600' : 'text-gray-600 bg-white border border-gray-400 hover:bg-gray-200 hover:text-gray-700'} transition-colors duration-200" data-page="${i}">${i}</button>`);
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) $paginationNumbers.append(`<span class="px-3 h-8 leading-tight text-gray-600">...</span>`);
            $paginationNumbers.append(`<button class="page-number px-3 h-8 leading-tight text-gray-600 bg-white border border-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors duration-200" data-page="${totalPages}">${totalPages}</button>`);
        }

        // Rebind the click handler for page numbers *after* updating the HTML.
        this.footerContainer.off('click', '.page-number').on('click', '.page-number', (event) => {
            const page = parseInt($(event.currentTarget).data('page'), 10);
            if (!isNaN(page)) {
                this.currentPage = page;
                this.updateTable();
            }
        });
    }

    updatePageInfo() {
        const total = this.filteredData.length;
        const start = total > 0 ? (this.currentPage - 1) * this.pageSize + 1 : 0;
        const end = this.pageSize === 'All' ? total : Math.min(this.currentPage * this.pageSize, total);
        this.footerContainer.find('#page-info').text(`Showing ${start} to ${end} of ${total} entries`);
    }

    initColumnToggles() {
        const $columnsList = this.toolbarContainer.find('#columns-list');
        $columnsList.empty();

        this.columns.forEach(column => {
            if (column.field !== 'actions') {
                $columnsList.append(`
                                        <label class="flex items-center">
                                            <input type="checkbox" class="column-toggle form-checkbox h-4 w-4 text-blue-600" data-field="${column.field}" ${column.visible ? 'checked' : ''}>
                                            <span class="ml-2 text-sm text-gray-700">${column.title}</span>
                                        </label>
                                    `);
            }
        });
    }

    updateColumnsVisibility() {
        this.columns.forEach(column => {
            if (column.field !== 'actions') {
                const checkbox = this.toolbarContainer.find(`.column-toggle[data-field="${column.field}"]`);
                column.visible = checkbox.length > 0 ? checkbox.prop('checked') : column.visible;
            }
        });

        // Ensure the 'actions' column is always visible
        const actionsColumn = this.columns.find(c => c.field === 'actions');
        if (actionsColumn) actionsColumn.visible = true;

        // Show/hide table cells and header cells based on column visibility
        this.columns.forEach(column => {
            const field = column.field;
            const isVisible = column.visible;

            // Update table view
            this.tableContainer.find(`td[data-field="${field}"], th[data-field="${field}"]`).toggle(isVisible);

            //Update card view
            this.cardContainer.find(`td[data-field="${field}"]`).closest('tr').toggle(isVisible);

        });
    }

    updateSortIcons() {
        this.tableContainer.find('th[data-sort]').removeClass('sort-asc sort-desc');
        this.tableContainer.find('th[data-sort] i').removeClass('fa-sort-up fa-sort-down').addClass('fa-sort');

        if (this.sortField) {
            const $currentSortHeader = this.tableContainer.find(`th[data-sort="${this.sortField}"]`);
            if ($currentSortHeader.length) {
                $currentSortHeader.addClass(this.sortOrder === 'asc' ? 'sort-asc' : 'sort-desc');
                $currentSortHeader.find('i').removeClass('fa-sort').addClass(this.sortOrder === 'asc' ? 'fa-sort-down' : 'fa-sort-up');
            }
        }
    }

    exportTable(format) {
        const filename = `table-export-${new Date().toISOString().split('T')[0]}`;
        const exportData = this.filteredData.map(item => {
            const rowData = {};
            this.columns.forEach(col => {
                if (col.field !== 'actions') {
                    rowData[col.field] = item[col.field];
                }
            });
            return rowData;
        });

        if (format === 'csv') {
            const csvContent = this.convertToCSV(exportData);
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            saveAs(blob, `${filename}.csv`);
        } else if (format === 'xlsx') {
            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
            XLSX.writeFile(workbook, `${filename}.xlsx`);
        } else if (format === 'json') {
            const jsonContent = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonContent], { type: 'application/json' });
            saveAs(blob, `${filename}.json`);
        }

    }

    convertToCSV(data) {
        if (!data.length) return '';

        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];

        for (const row of data) {
            const values = headers.map(header => {
                const value = String(row[header]).replace(/"/g, '""');
                return `"${value}"`;
            });
            csvRows.push(values.join(','));
        }

        return csvRows.join('\n');
    }

    addEventListeners() {
        //modal functionalities
        this.container.on('click', '[data-modal-target]', (event) => {
            const $target = $(event.currentTarget);
            const modalId = $target.data('modal-target');
            const itemId = parseInt($target.data('item-id'), 10);
            console.log("Modal target clicked:", modalId, "Item ID:", itemId);

            if (modalId === this.deleteModalId) {
                this.itemToDelete = itemId;
                this.deleteModal.show(); // Use Flowbite's show() method
            } else if (modalId === this.editModalId) {
                this.openEditModal(itemId);
            }

        });
        //toolbar functionalities
        this.toolbarContainer.find('#refresh').on('click', () => this.fetchData());
        this.toolbarContainer.find('#toggle').on('click', () => this.toggleViewMode());
        this.toolbarContainer.find('#fullscreen').on('click', () => this.toggleFullscreen());
        //search
        this.toolbarContainer.find('#search').on('input', () => this.updateTable());
        // Sorting
        this.tableContainer.on('click', 'th[data-sort]', (event) => {
            const field = $(event.currentTarget).data('sort');
            this.sortField = field;
            this.sortOrder = this.sortField === field ? (this.sortOrder === 'asc' ? 'desc' : 'asc') : 'asc';
            this.updateTable();
        });

        // colums dropdown. Use event delegation for dynamically added elements.
        this.toolbarContainer.on('change', '#toggle-all-columns', (event) => {
            const isChecked = $(event.target).prop('checked');
            this.toolbarContainer.find('.column-toggle').prop('checked', isChecked);
            this.updateColumnsVisibility();
        });

        this.toolbarContainer.on('change', '.column-toggle', () => {
            this.updateColumnsVisibility();
        });

        //export dropdown
        this.toolbarContainer.find('[data-export]').on('click', (event) => {
            const format = $(event.currentTarget).data('export');
            this.exportTable(format);
        });
        // Pagination
        this.footerContainer.find('#page-size').on('change', () => {
            this.pageSize = this.footerContainer.find('#page-size').val();
            if (this.pageSize === "All") {
                this.currentPage = 1;
            } else {
                this.pageSize = parseInt(this.pageSize, 10);
                this.currentPage = 1;
            }
            this.updateTable();
        });
        this.footerContainer.find('#prev-page').on('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.updateTable();
            }
        });

        this.footerContainer.find('#next-page').on('click', () => {
            const totalPages = this.pageSize === 'All' ? 1 : Math.ceil(this.filteredData.length / this.pageSize);
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.updateTable();
            }
        });

        this.footerContainer.find('#toggle-pagination').on('change', () => {
            this.options.showPagination = this.footerContainer.find('#toggle-pagination').prop('checked');
            this.updateTable();
        });

        //remove
        this.toolbarContainer.find('#remove').on('click', () => this.handleMultipleDelete());
        //checkboxes
        this.tableContainer.on('change', '#select-all', this.handleSelectAllChange.bind(this));
        this.container.on('change', '.row-checkbox', this.handleRowCheckboxChange.bind(this));
    }

    handleRowSelectionChange(id, isChecked) {
        if (isChecked) {
            if (!this.selections.includes(id)) this.selections.push(id);
        } else {
            this.selections = this.selections.filter(item => item !== id);
        }

        const allChecked = this.tableContainer.find('.row-checkbox').length > 0 &&
            this.tableContainer.find('.row-checkbox').length === this.tableContainer.find('.row-checkbox:checked').length;
        this.tableContainer.find('#select-all').prop('checked', allChecked);
        this.updateRemoveButtonState();
        this.tableContainer.find(`tr[data-id="${id}"], .card[data-id="${id}"]`).toggleClass('row-selected bg-blue-200', isChecked);
    }

    handleSelectAllChange() {
        const isChecked = this.container.find('#select-all').prop('checked');
        this.selections = isChecked ? this.tableData.map(item => item.id) : [];
        this.container.find('.row-checkbox').prop('checked', isChecked).trigger('change'); // Simplified this
        this.updateRemoveButtonState();
    }

    handleRowCheckboxChange(event) {
        const $checkbox = $(event.target);
        const id = parseInt($checkbox.data('id'), 10);
        const isChecked = $checkbox.prop('checked');
        this.handleRowSelectionChange(id, isChecked);
    }

    updateRemoveButtonState() {
        if (this.options.enableDelete) {
            this.toolbarContainer.find('#remove').prop('disabled', this.selections.length === 0);
        }
    }

    toggleFullscreen() {
        const doc = document.documentElement;
        if (!document.fullscreenElement) {
            if (doc.requestFullscreen) doc.requestFullscreen();
            else if (doc.webkitRequestFullscreen) doc.webkitRequestFullscreen();
            else if (doc.msRequestFullscreen) doc.msRequestFullscreen();
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            else if (document.msExitFullscreen) document.msExitFullscreen();
        }
    }

    toggleViewMode() {
        this.viewMode = this.viewMode === 'table' ? 'card' : 'table';
        this.tableContainer.toggleClass('hidden', this.viewMode !== 'table');
        this.cardContainer.toggleClass('hidden', this.viewMode !== 'card');
    }

    toggleDetails(id, viewType) {
        if (viewType === 'table') {
            this.tableContainer.find(`tr.detail-row[data-id="${id}"]`).toggleClass('hidden');
        } else {
            this.cardContainer.find(`.card[data-id="${id}"] .card-details`).toggleClass('hidden');
        }
    }

    createDeleteModal() {
        const modalHtml = `
          <div id="${this.deleteModalId}" tabindex="-1" aria-hidden="true" class="hidden overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full">
              <div class="relative p-4 w-full max-w-md max-h-full">
                  <div class="relative bg-white rounded-lg shadow-sm">
                      <button type="button" class="absolute top-3 end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center" data-modal-hide="${this.deleteModalId}">
                          <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                          </svg>
                          <span class="sr-only">Close modal</span>
                      </button>
                      <div class="p-4 md:p-5 text-center">
                          <svg class="mx-auto mb-4 text-gray-400 w-12 h-12" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
                          </svg>
                          <h3 class="mb-5 text-lg font-normal text-gray-700">Are you sure you want to delete this item?</h3>
                          <button data-modal-hide="${this.deleteModalId}" type="button" class="text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center me-2" id="confirm-delete">
                              Yes, I'm sure
                          </button>
                          <button data-modal-hide="${this.deleteModalId}" type="button" class="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10">No, cancel</button>
                      </div>
                  </div>
              </div>
          </div>
      `;
        $('body').append(modalHtml);
        // Initialize Flowbite modal *after* appending to DOM
        this.deleteModal = new Modal(document.getElementById(this.deleteModalId));

        // Use Flowbite's hide() method
        $(document).on('click', `[data-modal-hide="${this.deleteModalId}"]`, () => {
            this.deleteModal.hide();
        });

        $('#confirm-delete').on('click', () => this.handleConfirmDelete());
    }


    handleConfirmDelete() {
        if (this.itemToDelete) {
            this.tableData = this.tableData.filter(item => item.id !== this.itemToDelete);
            this.updateTable();
            this.fetchData();
            this.itemToDelete = null;
            this.deleteModal.hide(); // Use Flowbite's hide() method
        }
    }


    handleMultipleDelete() {
        this.tableData = this.tableData.filter(item => !this.selections.includes(item.id));
        this.selections = [];
        this.toolbarContainer.find('#remove').prop('disabled', true);
        this.tableContainer.find('#select-all').prop('checked', false);
        this.updateTable();
        this.fetchData();
    }

    createEditModal() {
        const modalHtml = `
        <div id="${this.editModalId}" tabindex="-1" class="hidden overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full">
            <div class="relative p-4 w-full max-w-2xl max-h-full">
                <div class="relative bg-white rounded-lg shadow-lg">
                    <div class="flex items-center justify-between p-4 md:p-5 border-b rounded-t">
                        <h3 class="text-lg font-semibold text-gray-900">
                            Edit Item
                        </h3>
                        <button type="button" class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center" data-modal-hide="${this.editModalId}">
                            <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                            </svg>
                            <span class="sr-only">Close modal</span>
                        </button>
                    </div>
                    <div class="p-4 md:p-5 space-y-4">
                        <form id="edit-form" class="grid grid-cols-2 gap-4"></form>
                    </div>
                    <div class="flex items-center p-4 md:p-5 border-t border-gray-200 rounded-b">
                        <button type="button" class="text-white bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center" id="save-edit">Save</button>
                        <button data-modal-hide="${this.editModalId}" type="button" class="ms-3 text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10">Cancel</button>
                    </div>
                </div>
            </div>
        </div>
      `;
        $('body').append(modalHtml);
        // Initialize Flowbite modal *after* appending to DOM
        this.editModal = new Modal(document.getElementById(this.editModalId));

        // Use Flowbite's hide() method for close buttons
        $(document).on('click', `[data-modal-hide="${this.editModalId}"]`, () => {
            this.editModal.hide();
        });

        $('#save-edit').on('click', () => this.saveEdit());

    }

    openEditModal(id) {
        this.editedItemId = id;
        const item = this.tableData.find(item => item.id === id);
        if (!item) {
            console.warn("Item not found for editing:", id);
            return;
        }
        const $form = $('#edit-form');
        $form.empty();

        this.columns.forEach(column => {
            if (column.field !== 'actions') {
                //escape here too!
                const escapedField = column.field.replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, "\\$1");
                const value = item[column.field] ?? '';
                $form.append(`
                  <div class="col-span-1">
                    <label for="edit-${escapedField}" class="block text-sm font-medium text-gray-700">${column.title}</label>
                    <input type="text" id="edit-${escapedField}" name="${column.field}" value="${value}"
                      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                  </div>
                `);
            }
        });
        this.editModal.show(); // Use Flowbite's show()
    }


    saveEdit() {
        const itemIndex = this.tableData.findIndex(item => item.id === this.editedItemId);
        console.log("saveEdit called.  itemIndex:", itemIndex, "editedItemId:", this.editedItemId);

        if (itemIndex === -1) {
            console.error("Item not found for editing:", this.editedItemId);
            return;
        }

        const $form = $('#edit-form');
        const updatedItem = { id: this.editedItemId };

        this.columns.forEach(column => {
            if (column.field !== 'actions') {
                const escapedField = column.field.replace(/([!"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, "\\$1");
                updatedItem[column.field] = $form.find(`#edit-${escapedField}`).val();
            }
        });

        this.tableData[itemIndex] = { ...this.tableData[itemIndex], ...updatedItem };

        this.editModal.hide(); // Use Flowbite's hide()

        this.fetchData(); //re fetch data to make sure it is up-to-date
    }
}