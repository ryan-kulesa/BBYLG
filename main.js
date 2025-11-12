$(document).ready(function() {
    
    // --- DataTables Initialization ---
    
    // Convert the checkbox cells to a standardized 'true'/'false' data attribute
    $('table tbody tr').each(function() {
        const $row = $(this);
        const $inStoreCell = $row.find('td:eq(2)');
        const $onlineCell = $row.find('td:eq(3)');
        
        // Extract the original checkbox state
        const inStoreChecked = $inStoreCell.find('input[type="checkbox"]').is(':checked');
        const onlineChecked = $onlineCell.find('input[type="checkbox"]').is(':checked');
        
        // Set a data attribute on the row for the custom filter logic later
        $row.attr('data-available', (inStoreChecked || onlineChecked) ? 'true' : 'false');
        
        // Replace the checkbox with the required text (True/False)
        $inStoreCell.html(inStoreChecked ? 'True' : 'False');
        $onlineCell.html(onlineChecked ? 'True' : 'False');
        
        // Add a class for potential styling (e.g., color coding True/False)
        $inStoreCell.addClass(inStoreChecked ? 'available' : 'unavailable');
        $onlineCell.addClass(onlineChecked ? 'available' : 'unavailable');
    });

    // Initialize DataTables
    const dataTable = $('table').DataTable({
        // 3. Sorting by all columns is default behaviour
        // 5. Search function (Smart search on all columns) is default behaviour
        
        // 6. All results on screen (no paging)
        paging: false,
        scrollY: "70vh", // Makes body scrollable vertically if needed
        scrollCollapse: true,
        
        // 2. Table fits within the width of the screen and is scrollable (handled by CSS and scrollX)
        scrollX: true, 
        
        // 4. Adjust the width of each column to your liking
        colReorder: true, // Allows dragging and dropping columns
        stateSave: true, // Saves state (sorting, filtering, column widths) across page loads
        
        // Configure DataTables appearance settings
        dom: 'Rtip', // 'R' for ColReorder, 't' for table, 'i' for info, 'p' for paging (which we disable)
        
        columnDefs: [
            {
                // 10. thumbnailImage column to actually display the image instead of the url
                targets: 9, // 'thumbnailImage' column is the 10th column (index 9)
                className: 'thumbnail-cell',
                render: function (data, type, row) {
                    if (type === 'display') {
                        // Display the image in the table
                        return '<img src="' + data + '" alt="Product Thumbnail" />';
                    }
                    // For all other types (sort, filter, data), return the original data (URL)
                    return data; 
                }
            }
        ],
        
        // Custom search for 'name' column only (requirement #5)
        initComplete: function () {
            this.api().columns().every(function (index) {
                // We only want to enable search on the 'name' column (index 1)
                if (index === 1) { 
                    const column = this;
                    // Move the default search input to a specific, custom location (for aesthetic purposes)
                    $('table_filter').hide(); // Hide default search
                    
                    // Add a new, custom search input above the table
                    $('#filter-sidebar').prepend(
                        '<div class="filter-group">' +
                        '<label for="name-search">Search Product Name:</label>' +
                        '<input type="text" id="name-search" placeholder="Filter by name...">' +
                        '</div>'
                    );

                    $('#name-search').on('keyup change clear', function () {
                        if (column.search() !== this.value) {
                            column.search(this.value).draw();
                        }
                    });
                }
            });
        }
    });

    // --- Custom Filtering Logic (Requirement #8) ---

    // 8. Hide results that aren't available (inStoreAvailability AND onlineAvailability are unchecked)
    let hideUnavailable = false; // Initial state

    // Custom filtering function to hide unavailable items
    $.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
        if (!hideUnavailable) {
            return true; // Show all rows
        }
        
        const row = dataTable.row(dataIndex).node();
        const isAvailable = $(row).attr('data-available') === 'true';
        
        return isAvailable;
    });

    // Attach click handler to the toggle button
    $('#toggle-available-btn').on('click', function() {
        hideUnavailable = !hideUnavailable; // Toggle the state
        
        // Update button text to reflect the new state
        if (hideUnavailable) {
            $(this).text('Show All Items');
        } else {
            $(this).text('Hide Unavailable Items');
        }
        
        // Redraw the table to apply the custom filter
        dataTable.draw();
    });

    // --- Sidebar Filters (Requirement #10 - Example: Filter by Year) ---
    
    // This is an example of the sidebar filter, focusing on the year in the 'name' column.
    const yearColumnIndex = 1;
    const years = dataTable.column(yearColumnIndex, { search: 'applied' }).data().map(function(name) {
        // Extract the year (e.g., (2024), (2025))
        const match = name.match(/ \((\d{4})\)/);
        return match ? match[1] : 'Other';
    }).unique().sort().toArray();

    let selectedYears = years;

    years.forEach(function(year) {
        $('#filter-checkboxes').append(
            '<div class="filter-group">' +
            '<label>' +
            '<input type="checkbox" checked class="year-filter" value="' + year + '"> ' +
            year + ' Models' +
            '</label>' +
            '</div>'
        );
    });

    // Custom filtering function for the year
    $.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
        const name = data[yearColumnIndex]; // Get the product name
        const match = name.match(/ \((\d{4})\)/);
        const year = match ? match[1] : 'Other';
        
        return selectedYears.includes(year);
    });

    // Handle filter checkbox changes
    $('#filter-checkboxes').on('change', '.year-filter', function() {
        selectedYears = $('.year-filter:checked').map(function() {
            return this.value;
        }).get();
        
        dataTable.draw();
    });
});
