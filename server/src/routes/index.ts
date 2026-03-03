import { Hono } from 'hono';
import auth from './auth';
import organizations from './organizations'
import users from './users'
import projects from './projects'
import events from './events'
import polls from './polls'
import notifications from './notifications'
import questions from './questions'
import comments from './comments'
import replies from './replies'

const routes = new Hono();

routes.route('/auth', auth);
routes.route('/organizations', organizations)
routes.route('/users', users)
routes.route('/projects', projects)
routes.route('/events', events)
routes.route('/polls', polls)
routes.route('/notifications', notifications)
routes.route('/questions', questions)
routes.route('/comments', comments)
routes.route('/replies', replies)

export default routes;
