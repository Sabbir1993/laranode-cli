class SimplePaginator {
    constructor(items, perPage, currentPage = 1, hasMore = false, options = {}) {
        this.items = items;
        this.perPage = perPage;
        this.currentPage = currentPage;
        this.hasMore = hasMore;
        this.options = options;
    }

    items() {
        return this.items;
    }

    hasMorePages() {
        return this.hasMore;
    }

    toArray() {
        return {
            data: this.items,
            meta: {
                current_page: this.currentPage,
                per_page: this.perPage,
            }
        };
    }

    /**
     * Render the pagination links as HTML
     * @param {string} path 
     * @returns {string} HTML
     */
    links(path = '?') {
        let html = '<ul class="pagination">';

        // Previous link
        html += `<li class="page-item ${this.currentPage <= 1 ? 'disabled' : ''}">`;
        html += `<a class="page-link" href="${this.currentPage <= 1 ? '#' : path + 'page=' + (this.currentPage - 1)}" rel="prev">&laquo; Previous</a>`;
        html += '</li>';

        // Next link
        html += `<li class="page-item ${!this.hasMore ? 'disabled' : ''}">`;
        html += `<a class="page-link" href="${!this.hasMore ? '#' : path + 'page=' + (this.currentPage + 1)}" rel="next">Next &raquo;</a>`;
        html += '</li>';

        html += '</ul>';
        return html;
    }
}

module.exports = SimplePaginator;
