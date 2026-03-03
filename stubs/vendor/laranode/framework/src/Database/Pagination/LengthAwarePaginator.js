class LengthAwarePaginator {
    constructor(items, total, perPage, currentPage = 1, options = {}) {
        this.items = items;
        this.total = total;
        this.perPage = perPage;
        this.currentPage = currentPage;
        this.lastPage = Math.ceil(total / perPage);
        this.options = options;
    }

    /**
     * Get the slice of items being paginated.
     */
    items() {
        return this.items;
    }

    /**
     * Determine if there are more items in the data source.
     */
    hasMorePages() {
        return this.currentPage < this.lastPage;
    }

    /**
     * Get the instance as an array containing data and meta.
     */
    toArray() {
        return {
            data: this.items,
            meta: {
                current_page: this.currentPage,
                last_page: this.lastPage,
                per_page: this.perPage,
                total: this.total,
            }
        };
    }

    /**
     * Render the pagination links as HTML (Bootstrap compatible default).
     * @param {string} path  Base URL for links
     * @returns {string} HTML string
     */
    links(path = '?') {
        if (this.lastPage <= 1) return ''; // No pagination needed

        let html = '<ul class="pagination">';

        // Previous link
        html += `<li class="page-item ${this.currentPage <= 1 ? 'disabled' : ''}">`;
        html += `<a class="page-link" href="${this.currentPage <= 1 ? '#' : path + 'page=' + (this.currentPage - 1)}" rel="prev">&laquo; Previous</a>`;
        html += '</li>';

        // simple numbered loop
        for (let i = 1; i <= this.lastPage; i++) {
            html += `<li class="page-item ${this.currentPage === i ? 'active' : ''}">`;
            html += `<a class="page-link" href="${path}page=${i}">${i}</a>`;
            html += '</li>';
        }

        // Next link
        html += `<li class="page-item ${this.currentPage >= this.lastPage ? 'disabled' : ''}">`;
        html += `<a class="page-link" href="${this.currentPage >= this.lastPage ? '#' : path + 'page=' + (this.currentPage + 1)}" rel="next">Next &raquo;</a>`;
        html += '</li>';

        html += '</ul>';
        return html;
    }
}

module.exports = LengthAwarePaginator;
