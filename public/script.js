fetch('/api/v1/list')
.then(response => response.json())
.then(data => {
	$('.container *').remove();
	data.forEach(item => {
		const card = document.createElement('div');
		card.classList.add('card');

		// Remove last word from title
		let title = item.name.split(' ');
		let tier = title.pop();
		title = title.join(' ');

		const cardTitle = document.createElement('h3');
		cardTitle.classList.add('card-title');
		cardTitle.innerText = title;
		card.appendChild(cardTitle);

		const cardTier = document.createElement('h4');
		cardTier.classList.add('card-tier');
		cardTier.classList.add('card-tier-' + tier);
		cardTier.innerText = tier;
		card.appendChild(cardTier);

		const cardBody = document.createElement('div');
		cardBody.classList.add('card-body');
		card.appendChild(cardBody);

		const cardPriceTitle = document.createElement('h4');
		cardPriceTitle.classList.add('card-title');
		cardPriceTitle.innerText = 'Lowest Price';
		cardBody.appendChild(cardPriceTitle);

		const cardPrice = document.createElement('p');
		cardPrice.classList.add('card-text');
		if (item.lowestPrice >= 1000000) {
			cardPrice.innerText = `${Math.round(item.lowestPrice / 100000) * 10}m`;
			cardPrice.classList.add('card-price-EXPENSIVE');
		}
		else if (item.lowestPrice >= 300000) {
			cardPrice.classList.add('card-price-PRICY');
		}
		else if (item.lowestPrice >= 100000) {
			cardPrice.classList.add('card-price-FAIR');
		}
		else {
			cardPrice.classList.add('card-price-CHEAP');
		}
		cardPrice.innerText = item.lowestPrice;
		cardPriceTitle.appendChild(cardPrice);

		const cardMeanPriceTitle = document.createElement('h4');
		cardMeanPriceTitle.classList.add('card-title');
		cardMeanPriceTitle.innerText = 'Mean Price';
		cardBody.appendChild(cardMeanPriceTitle);

		const cardMeanPrice = document.createElement('p');
		cardMeanPrice.classList.add('card-text');
		cardMeanPrice.innerText = item.meanPrice;
		cardMeanPriceTitle.appendChild(cardMeanPrice);

		const cardProfitTitle = document.createElement('h4');
		cardProfitTitle.classList.add('card-title');
		cardProfitTitle.innerText = 'Profit';
		cardBody.appendChild(cardProfitTitle);

		const cardProfit = document.createElement('p');
		cardProfit.classList.add('card-text');
		cardProfit.innerText = item.profit;
		cardProfitTitle.appendChild(cardProfit);

		const cardProfitPercentageTitle = document.createElement('h4');
		cardProfitPercentageTitle.classList.add('card-title');
		cardProfitPercentageTitle.innerText = 'Profit Percentage';
		cardBody.appendChild(cardProfitPercentageTitle);
		
		const cardProfitPercentage = document.createElement('p');
		cardProfitPercentage.classList.add('card-text');
		if (item.profitPercentage >= 500) {
			cardProfitPercentage.classList.add('card-profit-AWESOME');
		}
		else if (item.profitPercentage >= 200) {
			cardProfitPercentage.classList.add('card-profit-GREAT');
		}
		else if (item.profitPercentage >= 50) {
			cardProfitPercentage.classList.add('card-profit-GOOD');
		}
		cardProfitPercentage.innerText = item.profitPercentage.toString() + "%";
		cardProfitPercentageTitle.appendChild(cardProfitPercentage);

		const cardCopyLink = document.createElement('button');
		cardCopyLink.classList.add('card-button');
		cardCopyLink.innerText = 'Copy Link';
		cardCopyLink.onclick = () => {
			const link = document.createElement('input');
			link.value = `/viewauction ${item.items[0].uuid}`;
			document.body.appendChild(link);
			link.select();
			document.execCommand('copy');
			document.body.removeChild(link);
			cardCopyLink.innerText = 'Copied!';
			setTimeout(() => {
				cardCopyLink.innerText = 'Copy Link';
			}
			, 2000);
		};
		cardBody.appendChild(cardCopyLink);

		$('.container').append(card);
	});
});