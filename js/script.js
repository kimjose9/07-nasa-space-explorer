// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const dateForm = document.getElementById('dateForm');
const loadButton = document.getElementById('loadImages');
const gallery = document.getElementById('gallery');
const spaceFact = document.getElementById('spaceFact');
const imageModal = document.getElementById('imageModal');
const modalImage = document.getElementById('modalImage');
const modalDate = document.getElementById('modalDate');
const modalTitle = document.getElementById('modalTitle');
const modalExplanation = document.getElementById('modalExplanation');
const closeModalButton = document.getElementById('closeModal');

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

const spaceFacts = [
	'A day on Venus is longer than its year.',
	'Neutron stars can spin hundreds of times every second.',
	'The footprints left by Apollo astronauts can last millions of years.',
	'Saturn would float in water if you could find a bathtub large enough.',
	'Light from the Sun takes about eight minutes to reach Earth.'
];

spaceFact.textContent = spaceFacts[Math.floor(Math.random() * spaceFacts.length)];

dateForm.addEventListener('submit', (event) => {
	event.preventDefault();
	loadSpaceImages();
});

closeModalButton.addEventListener('click', () => imageModal.close());

imageModal.addEventListener('click', (event) => {
	if (event.target === imageModal) {
		imageModal.close();
	}
});

async function loadSpaceImages() {
	const startDate = startInput.value;
	const endDate = endInput.value;

	if (!startDate || !endDate || startDate > endDate) {
		showMessage('Choose a valid date range to load space images.');
		return;
	}

	const apiUrl = new URL('https://api.nasa.gov/planetary/apod');
	apiUrl.searchParams.set('start_date', startDate);
	apiUrl.searchParams.set('end_date', endDate);
	apiUrl.searchParams.set('api_key', 'DEMO_KEY');

	loadButton.disabled = true;
	loadButton.textContent = 'Loading...';
	gallery.setAttribute('aria-busy', 'true');
	showMessage('Loading space photos...');

	try {
		const response = await fetch(apiUrl);

		if (!response.ok) {
			throw new Error('NASA could not return photos for those dates. Please try again.');
		}

		const photos = await response.json();
		displayPhotos(photos);
	} catch (error) {
		showMessage(error.message || 'Unable to load space photos. Check your connection and try again.');
	} finally {
		loadButton.disabled = false;
		loadButton.textContent = 'Get Space Images';
		gallery.setAttribute('aria-busy', 'false');
	}
}

function displayPhotos(photos) {
	gallery.replaceChildren();

	if (!Array.isArray(photos) || photos.length === 0) {
		showMessage('No space photos were found for that date range.');
		return;
	}

	photos.forEach((photo) => {
		if (photo.media_type === 'image') {
			if (!isPlaceholderImage(photo)) {
				gallery.appendChild(createImageCard(photo));
			}
		} else if (photo.media_type === 'video') {
			gallery.appendChild(createVideoCard(photo));
		}
	});

	if (gallery.childElementCount === 0) {
		if (photos.some((photo) => photo.media_type === 'image' && isPlaceholderImage(photo))) {
			showApodPlaceholderMessage();
		} else {
			showMessage('No displayable space media was found for that date range.');
		}
	}
}

function isPlaceholderImage(photo) {
	const imageUrls = [photo.url, photo.hdurl];
	return photo.title === 'NASA Science' || imageUrls.some((url) => url && url.includes('nasa-logo@2x.png'));
}

function createImageCard(photo) {
	const card = document.createElement('button');
	const imageWrap = document.createElement('span');
	const image = document.createElement('img');
	const copy = document.createElement('span');
	const date = document.createElement('span');
	const title = document.createElement('span');

	card.type = 'button';
	card.className = 'gallery-item';
	card.setAttribute('aria-label', `View ${photo.title}, ${photo.date}`);
	card.addEventListener('click', () => openImageModal(photo));

	imageWrap.className = 'gallery-image-wrap';
	image.src = photo.url;
	image.alt = photo.title;
	image.loading = 'lazy';
	imageWrap.appendChild(image);

	copy.className = 'gallery-copy';
	date.className = 'gallery-date';
	date.textContent = formatDate(photo.date);
	title.className = 'gallery-title';
	title.textContent = photo.title;
	copy.append(date, title);
	card.append(imageWrap, copy);

	return card;
}

function createVideoCard(photo) {
	const card = document.createElement('article');
	const mark = document.createElement('p');
	const date = document.createElement('p');
	const title = document.createElement('h2');
	const link = document.createElement('a');

	card.className = 'video-entry';
	mark.className = 'video-mark';
	mark.textContent = 'VIDEO';
	date.className = 'gallery-date';
	date.textContent = formatDate(photo.date);
	title.className = 'gallery-title';
	title.textContent = photo.title;
	link.className = 'video-link';
	link.href = photo.url;
	link.target = '_blank';
	link.rel = 'noopener noreferrer';
	link.textContent = 'Watch APOD video';
	card.append(mark, date, title, link);

	return card;
}

function openImageModal(photo) {
	modalImage.src = photo.hdurl || photo.url;
	modalImage.alt = photo.title;
	modalDate.textContent = formatDate(photo.date);
	modalTitle.textContent = photo.title;
	modalExplanation.textContent = photo.explanation;
	imageModal.showModal();
}

function formatDate(date) {
	return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
}

function showMessage(message) {
	const placeholder = document.createElement('div');
	const text = document.createElement('p');

	placeholder.className = 'placeholder';
	text.textContent = message;
	placeholder.appendChild(text);
	gallery.replaceChildren(placeholder);
}

function showApodPlaceholderMessage() {
	const placeholder = document.createElement('div');
	const message = document.createElement('p');
	const archiveLink = document.createElement('a');

	placeholder.className = 'placeholder';
	message.textContent = 'NASA returned a placeholder logo instead of APOD photos. You can browse the APOD archive directly:';
	archiveLink.href = 'https://apod.nasa.gov/apod/archivepix.html';
	archiveLink.target = '_blank';
	archiveLink.rel = 'noopener noreferrer';
	archiveLink.textContent = 'NASA APOD archive';
	placeholder.append(message, archiveLink);
	gallery.replaceChildren(placeholder);
}
