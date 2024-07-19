"use strict";

const notifier = require("./Notifier");
const $logger = require("./Logger");

const adRepository = require("../repositories/adRepository.js");
const config = require("../config.js");

class Ad {
  constructor(ad) {
    this.id = ad.id;
    this.url = ad.url;
    this.title = ad.title;
    this.searchTerm = ad.searchTerm;
    this.price = ad.price;
    this.valid = false;
    (this.saved = null), (this.notify = ad.notify);
  }

  process = async () => {
    if (!this.isValidAd()) {
      $logger.debug("Ad not valid");
      return false;
    }

    try {
      // check if this entry was already added to DB
      if (await this.alreadySaved()) {
        return this.checkPriceChange();
      } else {
        // create a new entry in the database
        return this.addToDataBase();
      }
    } catch (error) {
      $logger.error(error);
    }
  };

  alreadySaved = async () => {
    try {
      this.saved = await adRepository.getAd(this.id);
      return true;
    } catch (error) {
      return false;
    }
  };

  addToDataBase = async () => {
    try {
      await adRepository.createAd(this);
      $logger.info("Ad " + this.id + " added to the database");
    } catch (error) {
      $logger.error(error);
    }

    if (this.notify) {
      try {
        const msg =
          "New ad found!\n" +
          this.title +
          " - R$" +
          this.price +
          "\n\n" +
          this.url;
        notifier.sendNotification(msg, this.id);
      } catch (error) {
        $logger.error("Could not send a notification");
      }
    }
  };

  updatePrice = async () => {
    $logger.info("updatePrice");

    try {
      await adRepository.updateAd(this);
    } catch (error) {
      $logger.error(error);
    }
  };

  checkPriceChange = async () => {
    if (this.price !== this.saved.price) {
      await this.updatePrice(this);

      // just send a notification if the price dropped
      if (this.price < this.saved.price) {
        $logger.info("This ad had a price reduction: " + this.url);

        const decreasePercentage = Math.abs(
          Math.round(((this.price - this.saved.price) / this.saved.price) * 100)
        );

        const msg =
          "Price drop found! " +
          decreasePercentage +
          "% OFF!\n" +
          "From R$" +
          this.saved.price +
          " to R$" +
          this.price +
          "\n\n" +
          this.url;

        try {
          await notifier.sendNotification(msg, this.id);
        } catch (error) {
          $logger.error(error);
        }
      }
    }
  };

  // some elements found in the ads selection don't have an url
  // I supposed that OLX adds other content between the ads,
  // let's clean those empty ads
  isValidAd = () => {
    // Destructure properties from this, providing default values where necessary
    const { title = "", price, url, id } = this;

    const titleLower = title.toLowerCase();
    const titleContainsLower = config.titleContains.map((keyword) =>
      keyword.toLowerCase()
    );
    const titleExcludesLower = config.titleExcludes.map((keyword) =>
      keyword.toLowerCase()
    );

    // Check if the title contains required keywords
    const titleContainsRequired =
      titleContainsLower.length === 0 ||
      titleContainsLower.some((keyword) => titleLower.includes(keyword));

    // Check if the title excludes specified keywords
    const titleExcludesRequired = !titleExcludesLower.some((keyword) =>
      titleLower.includes(keyword)
    );

    // Determine if the ad is valid based on all conditions
    const isValid =
      !isNaN(price) &&
      url &&
      id &&
      titleExcludesRequired &&
      titleContainsRequired;

    this.valid = isValid;

    if (isValid) {
      console.log("Ad is valid");
    } else {
      // Log reasons for invalid ad
      console.log(
        "Ad is not valid due to:\n" +
          [
            { condition: isNaN(price), message: "Price is not a number" },
            { condition: !url, message: "URL is not defined" },
            { condition: !id, message: "ID is not defined" },
            {
              condition: !titleExcludesRequired,
              message: "Title includes excluded words",
            },
            {
              condition: !titleContainsRequired,
              message: "Title does not contain required words",
            },
          ]
            .filter(({ condition }) => condition)
            .map(({ message }) => `- ${message}`)
            .join("\n")
      );
    }

    return isValid;
  };
}

module.exports = Ad;
