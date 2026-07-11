const jobs = new Map();

module.exports = {
  set(id, data) {
    jobs.set(id, data);
  },

  get(id) {
    return jobs.get(id);
  },

  update(id, data) {
    const old = jobs.get(id) || {};

    jobs.set(id, {
      ...old,
      ...data,
    });
  },

  delete(id) {
    jobs.delete(id);
  },
};
