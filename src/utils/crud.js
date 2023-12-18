const { handleError } = require("../middleware/errorHandler");

const defaultPageLimit = 10;

const crudControllers = {
  getAll: (model, options = {}) => {
    return async (req, res) => {
      try {
        const { where = {}, include = [], attributes, raw = true, nest = true, send = true } = options;
        let pageOptions = {}, page, limit;

        if (options.paginated) {
          page = parseInt(req.query.page) || 1;
          limit = parseInt(req.query.limit) || defaultPageLimit;
          pageOptions.limit = limit;
          pageOptions.offset = (page - 1) * limit;
        }

        const { count, rows } = await model.findAndCountAll({
          where,
          include,
          attributes,
          raw,
          nest,
          order: [["createdAt", "DESC"]], // Order by the latest data
          ...pageOptions,
        });

        const f = options.f ?? ((req, res, rows) => {
          return {
            rows,
            totalRows: count,
          };
        });

        const data = await f(req, res, rows);

        if (!data) {
          const ret = {
            code: 404,
            status: "Not Found",
            message: `${model.name} not found`,
          };
          if (send) res.status(404).json(ret);
          return ret;
        }

        if (options.paginated) {
          const totalPages = Math.ceil(count / limit);
          data.totalPages = totalPages;
          data.currentPage = page;
        }

        const ret = {
          code: 200,
          status: "OK",
          message: `Success getting ${options.paginated ? "paginated " : ""}${model.name}(s)`,
          data,
        };
        if (send) res.status(200).json(ret);
        return ret;
      } catch (err) {
        return handleError(res, err);
      }
    };
  },

  getById: (model, options = {}, _id) => {
    return async (req, res) => {
      const id = _id ?? req.params.id;
      try {
        const row = await model.findByPk(id, {
          where: options.where || {},
          include: options.include || [],
          attributes: options.attributes || undefined,
          raw: options.raw || true,
          nest: options.nest || true,
        });

        if (!row) {
          const ret = {
            code: 404,
            status: "Not Found",
            message: `${model.name} not found`,
          };
          if (options.send !== false) res.status(404).json(ret);
          return ret;
        }

        const ret = {
          code: 200,
          status: "OK",
          message: `Success getting ${model.name}`,
          data: row,
        };

        if (options.send !== false) res.status(200).json(ret);
        return ret;
      } catch (err) {
        return handleError(res, err);
      }
    };
  },

  create: (model, data, options = {}) => {
    const { send = true } = options;
    return async (req, res) => {
      data ??= req.body;
      try {
        const row = await model.create(data);
        const ret = {
          code: 201,
          status: "Created",
          message: `Success creating ${model.name}`,
          data: row,
        };
        if (send) res.status(201).json(ret);
        return ret;
      } catch (err) {
        return handleError(res, err);
      }
    };
  },

  update: (model, options = {}, _id, _data) => {
    const { include, attributes, raw = true, nest = true, send = true } = options;
    return async (req, res) => {
      id = _id ?? req.params.id;
      data = _data ?? req.body;

      try {
        const [updated] = await model.update(data, {
          where: { id },
        });
        if (!updated) {
          const ret = {
            code: 404,
            status: "Not Found",
            message: `${model.name} not found, finding ${id}`,
          };
          if (send) res.status(404).json(ret);
          return ret;
        }

        const row = await model.findByPk(id, {
          include,
          attributes,
          raw,
          nest,
        });
        const ret = {
          code: 200,
          status: "OK",
          message: `Success updating ${model.name}`,
          data: row,
        };
        if (send) res.status(200).json(ret);
        return ret;
      } catch (err) {
        return handleError(res, err);
      }
    };
  },

  delete: (model, options = {}, _id) => {
    const { send = true } = options;
    return async (req, res) => {
      id = _id ?? req.params.id;
      try {
        const deleted = await model.destroy({
          where: { id },
        });
        if (!deleted) {
          const ret = {
            code: 404,
            status: "Not Found",
            message: `${model.name} not found, finding ${id}`,
          };
          if (send) res.status(404).json(ret);
          return ret;
        }
        const ret = {
          code: 200,
          status: "OK",
          message: `Success deleting ${model.name}`,
        };
        if (send) res.status(200).json(ret);
        return ret;
      } catch (err) {
        return handleError(res, err);
      }
    };
  },
};

module.exports = { crudControllers };
