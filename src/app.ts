import express, { Request, Response } from "express";
import querystring from "querystring";
import jwt from "jsonwebtoken";
import { get } from "lodash";
import axios from "axios";
import cors from "cors";
import cookieParser from "cookie-parser"
import dotenv from "dotenv"

dotenv.config()
const app = express();
app.use(cookieParser())

const secret = "shhhhh"

app.use(
	cors({
		origin: "http://localhost:3000",
		credentials: true
	})
)

export interface GitHubUser {
	login: string;
	id: number;
	node_id: string;
	avatar_url: string;
	gravatar_id: string;
	url: string;
	html_url: string;
	followers_url: string;
	following_url: string;
	gists_url: string;
	starred_url: string;
	subscriptions_url: string;
	organizations_url: string;
	repos_url: string;
	events_url: string;
	received_events_url: string;
	type: string;
	site_admin: boolean;
	name: string;
	company: null;
	blog: string;
	location: string;
	email: string;
	hireable: null;
	bio: string;
	twitter_username: string;
	public_repos: number;
	public_gists: number;
	followers: number;
	following: number;
	created_at: Date;
	updated_at: Date;
}

async function getGithubUser({ code }: { code: string }): Promise<GitHubUser> {
	const githubToken = await axios
		.post(
			`https://github.com/login/oauth/access_token?client_id=${process.env.GITHUB_CLIENT_ID}&client_secret=${process.env.GITHUB_CLIENT_SECRET}&code=${code}`
		)
		.then((res) => res.data)

		.catch((error) => {
			throw error;
		});

	const decoded = await querystring.parse(githubToken);
	const accessToken = decoded.access_token;

	return axios
		.get("https://api.github.com/user", {
			headers: { Authorization: `Bearer ${accessToken}` },
		})
		.then((res) => res.data)
		.catch((error) => {
			console.error(`Error getting user from GitHub`);
			throw error;
		});
}

app.get("/api/auth/github", async (req: Request, res: Response) => {
	const code = get(req, "query.code");
	const path = get(req, "query.path", "/");

	if (!code) {
		throw new Error("No code!");
	}

	const githubUser = await getGithubUser({ code });

	const token = jwt.sign(githubUser, secret);

	res.cookie(secret, token, {
		httpOnly: true,
		domain: "localhost",
	});

	res.redirect(`http://localhost:3000${path}`);
});

app.get("/api/me", (req: Request, res: Response) => {
	const cookie = get(req, `cookies[${secret}]`)

	try {
		const decode = jwt.verify(cookie, secret);

		return res.send(decode);
	} catch (error) {
		return res.send(null);
	}
});

app.listen(4000, () => {
	console.log("server is listening");
});
