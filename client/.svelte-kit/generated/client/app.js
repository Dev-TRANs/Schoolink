export { matchers } from './matchers.js';

export const nodes = [
	() => import('./nodes/0'),
	() => import('./nodes/1'),
	() => import('./nodes/2'),
	() => import('./nodes/3'),
	() => import('./nodes/4'),
	() => import('./nodes/5'),
	() => import('./nodes/6'),
	() => import('./nodes/7'),
	() => import('./nodes/8'),
	() => import('./nodes/9'),
	() => import('./nodes/10'),
	() => import('./nodes/11'),
	() => import('./nodes/12'),
	() => import('./nodes/13'),
	() => import('./nodes/14'),
	() => import('./nodes/15'),
	() => import('./nodes/16'),
	() => import('./nodes/17'),
	() => import('./nodes/18'),
	() => import('./nodes/19'),
	() => import('./nodes/20'),
	() => import('./nodes/21'),
	() => import('./nodes/22'),
	() => import('./nodes/23'),
	() => import('./nodes/24'),
	() => import('./nodes/25'),
	() => import('./nodes/26'),
	() => import('./nodes/27'),
	() => import('./nodes/28')
];

export const server_loads = [];

export const dictionary = {
		"/": [~2],
		"/about": [3],
		"/events": [4],
		"/events/create": [7],
		"/events/[eventId]": [5],
		"/events/[eventId]/edit": [6],
		"/notifications": [8],
		"/organizations/[organizationId]": [9],
		"/polls": [10],
		"/polls/create": [13],
		"/polls/[pollId]": [11],
		"/polls/[pollId]/edit": [12],
		"/projects": [14],
		"/projects/create": [17],
		"/projects/[projectId]": [15],
		"/projects/[projectId]/edit": [16],
		"/questions": [18],
		"/questions/create": [21],
		"/questions/[questionId]": [19],
		"/questions/[questionId]/edit": [20],
		"/settings": [22],
		"/settings/organization/profile": [23],
		"/settings/organization/users": [24],
		"/settings/user/account": [25],
		"/settings/user/profile": [26],
		"/signin": [27],
		"/users/[userId]": [28]
	};

export const hooks = {
	handleError: (({ error }) => { console.error(error) }),
	
	reroute: (() => {}),
	transport: {}
};

export const decoders = Object.fromEntries(Object.entries(hooks.transport).map(([k, v]) => [k, v.decode]));

export const hash = false;

export const decode = (type, value) => decoders[type](value);

export { default as root } from '../root.js';