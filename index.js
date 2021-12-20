const express = require('express');
const path = require('path');
const https = require('https');

require('dotenv').config();

const app = express();
const dir =  path.join(__dirname, 'public')
const port = process.env.PORT || 3000;

var auctionLink = 'api.hypixel.net';
var auctionData = [];
var profitData = [];
var profitList = [];

var pagesFetched = 0;
var pageIterator = 0;
let pagesToFetch = 1;

const serverOptions = {
	fetchTimeout: 60000,
	fetchSpeed: 50,
	fetchPagesLimit: 80,
	
	profit_finder_loop_timeout: 30000,

	mean_outlier_sensitivity: 3,
}

var flipFilter = {
	maxPrice: 3000000,
	minProfit: 10000,
	minProfitPercent: 5,
	minVolume: 1,
}

//#region Data/API
let filter_data = (data) => {
	// Filters out items that are not bins
	data = data.filter(item => item.bin === true && item.claimed === false);

	// Filters out items that are common or uncommon
	data = data.filter(item => item.tier !== 'COMMON');

	// Maps each item so only useful field are left
	data = data.map(item => {
		return {
			uuid: item.uuid,
			name: item.item_name,
			tier: item.tier,
			price: item.starting_bid,
			category: item.category,
		}
	});

	// Sort items by tier and price
	data.sort((a, b) => {
		return a.tier - b.tier;
	});
	
	data.sort((a, b) => {
		return a.starting_bid - b.starting_bid;
	});

	return data;
}

let get_auction_data = () => {
	while (pagesFetched < pagesToFetch) {
		let options = {
			hostname: auctionLink,
			port: 443,
			path: `/skyblock/auctions?key=${process.env.API_KEY}&page=${pagesFetched}`,
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			}
		}

		let dataStream = '';
		setTimeout(() => {
			https.request(options, (res) => {
				console.log(`Page: ${pageIterator}, Status Code: ${res.statusCode}`);
				pageIterator++;

				if (res.statusCode === 200) {
					res.on('data', (d) => {
						dataStream += d;
					});

					res.on('end', () => {
						let json = JSON.parse(dataStream);
						auctionData = [...auctionData, ...filter_data(json.auctions)];
						pagesToFetch = json.totalPages < serverOptions.fetchPagesLimit ? json.totalPages : serverOptions.fetchPagesLimit;
					});
				}
			}).end();
		}, serverOptions.fetchSpeed * pagesFetched);

		pagesFetched++;
	}
}

let fetch_loop = () => {
	auctionData = []
	pagesFetched = 0;
	pageIterator = 0;

	get_auction_data();

	setTimeout(fetch_loop, serverOptions.fetchTimeout);
}
//#endregion

//#region Equations
let true_price = (values) => {
	const totalIterations = 10;
	let currentIterations = 0;
	let effectiveSensitivity = serverOptions.mean_outlier_sensitivity;

	let sum, mean, filtered;

	while (currentIterations < totalIterations) {
		// Second mean
		sum = (filtered ? filtered : values).reduce((a, b) => a + b, 0);
		mean = sum / (filtered ? filtered : values).length;

		// Remove outliers
		let sensitivityRate = (
			mean * effectiveSensitivity * 0.4 +
			(filtered ? filtered : values)[0] * 0.6
		)

		filtered = (filtered ? filtered : values).filter(value => {return value < sensitivityRate});
		filtered.sort((a, b) => {return a - b});

		effectiveSensitivity -= 0.15 / (currentIterations + 1);

		currentIterations++;
	}

	// Median
	let median = filtered.sort((a, b) => a - b)[Math.floor(filtered.length / 2)];

	let truePrice = (
		mean * 0.4 +
		median * 0.6
	)

	return truePrice;
}

//console.log(true_price([100, 2000, 2001, 2002, 2002, 2002, 2002, 2003, 20003, 2003, 20003, 2005, 5000, 8000, 10000, 90000, 5000000]));

//#endregion

let profit_finder_loop = () => {
	profitCallMap = {};
	profitData = [];

	auctionData.forEach(item => {
		if (item.name + ' ' + item.tier in profitCallMap) {
			profitData[profitCallMap[item.name + ' ' + item.tier]].prices.push(item.price);
			profitData[profitCallMap[item.name + ' ' + item.tier]].items.push(item);
			profitData[profitCallMap[item.name + ' ' + item.tier]].items.sort((a, b) => a.price - b.price);
		}
		else {
			profitData[profitData.length] = {
				name: item.name + ' ' + item.tier,
				prices: [item.price],
				meanPrice: 0,
				lowestPrice: 0,
				profit: 0,
				profitPercentage: 0,
				items: [item]
			}
			profitCallMap[item.name + ' ' + item.tier] = profitData.length - 1;
		}
	})

	profitList = Object.values(profitData);

	profitList.forEach(item => {
		item.meanPrice =  Math.round(true_price(item.prices));
		item.lowestPrice = Math.round(item.items[0].price);
		item.profit =  Math.round(item.meanPrice - item.lowestPrice);
		item.profitPercentage =  Math.round((item.profit / item.lowestPrice) * 100);
	})

	profitList = profitList.filter(item => item.profitPercentage > flipFilter.minProfitPercent);
	profitList = profitList.filter(item => item.lowestPrice < flipFilter.maxPrice);
	profitList = profitList.filter(item => item.profit > flipFilter.minProfit);
	profitList = profitList.filter(item => item.items.length > flipFilter.minVolume);

	profitList = profitList.filter(item => !item.items || item.items.length > 1);
	profitList = profitList.sort((a, b) => b.profitPercentage - a.profitPercentage);

	/*
	let index = Math.round(Math.random() * 10);
	console.log("Name      : ", profitList[index]?.name);
	console.log("Lowest    : ", profitList[index]?.lowestPrice);
	console.log("True Price: ", profitList[index]?.meanPrice);
	console.log("Profit    : ", profitList[index]?.profit);
	console.log("Profit %  : ", profitList[index]?.profitPercentage);
	console.log("Volume    : ", profitList[index]?.items.length);
	console.log(`Lowest Auction : /viewauction ${profitList[index]?.items[0].uuid}`);
	console.log(`List : ${profitList[index]?.items.map(item => item.price)}`);
	console.log("__________________________________")
	*/

	setTimeout(profit_finder_loop, serverOptions.profit_finder_loop_timeout);
}

get_auction_data(); // First time, fetches total pages
setTimeout(fetch_loop, 2000);
setTimeout(profit_finder_loop, 4000);

app.use(express.static(dir));
app.get('/api/v1/list', (req, res) => {
	console.log(`${new Date().toLocaleString()} - ${req.ip} - ${req.url}`);
	if (req){
		res.send(profitList)
	}
});

app.listen(port);
console.log(`Listening on port ${port}`);
console.log(`localhost:${port}`);