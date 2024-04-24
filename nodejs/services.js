// this file is not present but it's  for the exercice
import { query } from '../db';

export const getProject = async (id) => {
    const projects = await query('SELECT * FROM projects WHERE id = ? AND status != "DELETED"', [id]).catch(() => ([]));

    if (!projects.length) { return null; }

    return projects[0];
};

export const insertProject = async (data) => {
    // Generate id
    const id = !data.id ? uuidv4() : data.id;

    if (!data.status) { data.status = 'PENDING'; }

    // Mandatory parameters
    if (!data.user_id || !data.solution_id) { throw new Error('user_id and solution_id are required'); }

    // Insert
    if (Object.keys(data).length) {
        await query(`INSERT INTO projects SET ?`, [{ ...data, id }]);
    }

    // Return new project
    return getProject(id);
};

export const updateProject = async (id, data) => {
    if (Object.keys(data).length) {
        await query(`UPDATE projects SET ? WHERE id="${id}"`, [data, id]);
    }

    return getProject(id);
};

