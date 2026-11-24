export const team = [
	{
		name: "Ada Lovelace",
		email: "ada.lovelace@example.com",
		role: "engineer"
	},
	{
		name: "Grace Hopper",
		email: "grace.hopper@example.com",
		role: "engineer"
	},
	{
		name: "Katherine Johnson",
		email: "katherine.johnson@example.com",
		role: "engineer"
	},
	{
		name: "Margaret Hamilton",
		email: "margaret.hamilton@example.com",
		role: "engineer"
	},
	{
		name: "Susan Kare",
		email: "susan.kare@example.com",
		role: "designer"
	},
	{
		name: "Annie Easley",
		email: "annie.easley@example.com",
		role: "engineer"
	},
	{
		name: "Radia Perlman",
		email: "radia.perlman@example.com",
		role: "engineer"
	},
	{
		name: "Frances Allen",
		email: "frances.allen@example.com",
		role: "writer"
	}
];
export function membersWithRole(role) {
	return team.filter((member) => member.role === role);
}

//# sourceMappingURL=data:application/json;base64,eyJtYXBwaW5ncyI6IkFBTUEsT0FBTyxNQUFNLE9BQXFCO0NBQ2hDO0VBQUUsTUFBTTtFQUFnQixPQUFPO0VBQTRCLE1BQU07Q0FBVztDQUM1RTtFQUFFLE1BQU07RUFBZ0IsT0FBTztFQUE0QixNQUFNO0NBQVc7Q0FDNUU7RUFBRSxNQUFNO0VBQXFCLE9BQU87RUFBaUMsTUFBTTtDQUFXO0NBQ3RGO0VBQUUsTUFBTTtFQUFxQixPQUFPO0VBQWlDLE1BQU07Q0FBVztDQUN0RjtFQUFFLE1BQU07RUFBYyxPQUFPO0VBQTBCLE1BQU07Q0FBVztDQUN4RTtFQUFFLE1BQU07RUFBZ0IsT0FBTztFQUE0QixNQUFNO0NBQVc7Q0FDNUU7RUFBRSxNQUFNO0VBQWlCLE9BQU87RUFBNkIsTUFBTTtDQUFXO0NBQzlFO0VBQUUsTUFBTTtFQUFpQixPQUFPO0VBQTZCLE1BQU07Q0FBUztBQUM5RTtBQUVBLE9BQU8sU0FBUyxnQkFBaUIsTUFBd0M7Q0FDdkUsT0FBTyxLQUFLLFFBQVEsV0FBVyxPQUFPLFNBQVMsSUFBSTtBQUNyRCIsIm5hbWVzIjpbXSwic291cmNlcyI6WyJ0ZWFtLnRzIl0sInZlcnNpb24iOjMsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBpbnRlcmZhY2UgVGVhbU1lbWJlciB7XG4gIG5hbWU6IHN0cmluZ1xuICBlbWFpbDogc3RyaW5nXG4gIHJvbGU6ICdlbmdpbmVlcicgfCAnZGVzaWduZXInIHwgJ3dyaXRlcidcbn1cblxuZXhwb3J0IGNvbnN0IHRlYW06IFRlYW1NZW1iZXJbXSA9IFtcbiAgeyBuYW1lOiAnQWRhIExvdmVsYWNlJywgZW1haWw6ICdhZGEubG92ZWxhY2VAZXhhbXBsZS5jb20nLCByb2xlOiAnZW5naW5lZXInIH0sXG4gIHsgbmFtZTogJ0dyYWNlIEhvcHBlcicsIGVtYWlsOiAnZ3JhY2UuaG9wcGVyQGV4YW1wbGUuY29tJywgcm9sZTogJ2VuZ2luZWVyJyB9LFxuICB7IG5hbWU6ICdLYXRoZXJpbmUgSm9obnNvbicsIGVtYWlsOiAna2F0aGVyaW5lLmpvaG5zb25AZXhhbXBsZS5jb20nLCByb2xlOiAnZW5naW5lZXInIH0sXG4gIHsgbmFtZTogJ01hcmdhcmV0IEhhbWlsdG9uJywgZW1haWw6ICdtYXJnYXJldC5oYW1pbHRvbkBleGFtcGxlLmNvbScsIHJvbGU6ICdlbmdpbmVlcicgfSxcbiAgeyBuYW1lOiAnU3VzYW4gS2FyZScsIGVtYWlsOiAnc3VzYW4ua2FyZUBleGFtcGxlLmNvbScsIHJvbGU6ICdkZXNpZ25lcicgfSxcbiAgeyBuYW1lOiAnQW5uaWUgRWFzbGV5JywgZW1haWw6ICdhbm5pZS5lYXNsZXlAZXhhbXBsZS5jb20nLCByb2xlOiAnZW5naW5lZXInIH0sXG4gIHsgbmFtZTogJ1JhZGlhIFBlcmxtYW4nLCBlbWFpbDogJ3JhZGlhLnBlcmxtYW5AZXhhbXBsZS5jb20nLCByb2xlOiAnZW5naW5lZXInIH0sXG4gIHsgbmFtZTogJ0ZyYW5jZXMgQWxsZW4nLCBlbWFpbDogJ2ZyYW5jZXMuYWxsZW5AZXhhbXBsZS5jb20nLCByb2xlOiAnd3JpdGVyJyB9LFxuXVxuXG5leHBvcnQgZnVuY3Rpb24gbWVtYmVyc1dpdGhSb2xlIChyb2xlOiBUZWFtTWVtYmVyWydyb2xlJ10pOiBUZWFtTWVtYmVyW10ge1xuICByZXR1cm4gdGVhbS5maWx0ZXIoKG1lbWJlcikgPT4gbWVtYmVyLnJvbGUgPT09IHJvbGUpXG59XG4iXX0=