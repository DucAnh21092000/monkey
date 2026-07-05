const jobs = new Map();

exports.create = (id) => {
  jobs.set(id, {
    progress: 0,
    status: "waiting",
  });
};

exports.update = (id, value) => {
  if (!jobs.has(id)) return;

  jobs.get(id).progress = value;
};

exports.finish = (id) => {
  if (!jobs.has(id)) return;

  jobs.get(id).progress = 100;
  jobs.get(id).status = "done";
};

exports.fail = (id) => {
  if (!jobs.has(id)) return;

  jobs.get(id).status = "error";
};

exports.get = (id) => {
  return jobs.get(id) || null;
};
