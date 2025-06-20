class ApiFeatures {
    constructor(query, queryStr) {
        this.query = query;
        this.queryStr = queryStr;
    }

    // Search by name
    search() {
        const keyword = this.queryStr.keyword ? {
            $or: [
                { name: { $regex: this.queryStr.keyword, $options: "i" } },
                { description: { $regex: this.queryStr.keyword, $options: "i" } }
            ]
        } : {};

        this.query = this.query.find({ ...keyword });
        return this;
    }

    // Filtering
    filter() {
        const queryCopy = { ...this.queryStr };

        const removeFields = ["keyword", "page", "limit", "sort", "fields"];
        removeFields.forEach(key => delete queryCopy[key]);

        // Handle advanced filtering like price[gte], ratings[lt]
        for (const key in queryCopy) {
            if (key.includes('[')) {
                const [field, op] = key.split('[');
                const operator = op.replace(']', '');
                queryCopy[field] = queryCopy[field] || {};
                queryCopy[field][operator] = queryCopy[key];
                delete queryCopy[key];
            }
        }

        // Support for comma-separated values like tags=mobile,laptop
        if (queryCopy.tags) {
            queryCopy.tags = { $in: queryCopy.tags.split(',') };
        }

        // Boolean conversion
        if (queryCopy.isFeatured !== undefined) {
            queryCopy.isFeatured = queryCopy.isFeatured === 'true';
        }

        // Final parse and find
        let queryStr = JSON.stringify(queryCopy);
        queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, key => `$${key}`);

        this.query = this.query.find(JSON.parse(queryStr));
        return this;
    }

    // Pagination
    pagination(resultPerPage) {
        const currentPage = Number(this.queryStr.page) || 1;
        const skip = resultPerPage * (currentPage - 1);

        this.query = this.query.limit(resultPerPage).skip(skip);
        return this;
    }

    // Optional: Sorting
    sort() {
        if (this.queryStr.sort) {
            const sortBy = this.queryStr.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        } else {
            this.query = this.query.sort('-createdAt'); // default sort by newest
        }
        return this;
    }

    // Optional: Select specific fields
    fields() {
        if (this.queryStr.fields) {
            const fields = this.queryStr.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        } else {
            this.query = this.query.select('-__v'); // hide __v by default
        }
        return this;
    }
}

module.exports = ApiFeatures;