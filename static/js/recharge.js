var recharge = {
  registerControl: function () {
    const listAmountsItem = document.querySelectorAll(".recharge-amount__item:has([data-amount]");
    listAmountsItem.forEach((item) =>
      item.addEventListener("click", recharge.handleSelectAmount)
    );

    const listTypesItem = document.querySelectorAll(".recharge-type__item");
    listTypesItem.forEach((item) =>
      item.addEventListener("click", recharge.handleSelectType)
    );

    const form = document.querySelector("#form_recharge");
    form.addEventListener("submit", recharge.handleSubmitForm);

    const accountType = document.querySelector("#account_type");
    recharge.setTextInputUsername(accountType.value);
    accountType.addEventListener("change", recharge.handleChangeAccountType);
  },
  handleChangeAccountType: function (e) {
    document.querySelector("#success_message").innerText = "";
    recharge.setTextInputUsername(e.target.value);
  },
  setTextInputUsername: function (type) {
    const elementError = document.querySelector("#error_message");
    const containerUsername = document.querySelector("#container_username");
    const typeLogin = helpers.getLabelAndPlaceholderByGame(type);
    if (typeLogin) {
      const [label, placeholder] = typeLogin;
      const labelElement = document.querySelector("#label_username");
      const inputElement = document.querySelector("#username");
      labelElement.innerText = label;
      inputElement.placeholder = placeholder;
      inputElement.value = "";
      if (
        elementError.innerText ===
        "Cách đăng nhập này đang bảo trì, vui lòng thử cách khác"
      ) {
      }
      elementError.innerText = "";
      containerUsername.classList.remove("hidden");
      return true;
    } else {
      elementError.innerText =
        "Cách đăng nhập này đang bảo trì, vui lòng thử cách khác";
      containerUsername.classList.add("hidden");
      return false;
    }
  },
  handleSelectAmount: function (e) {
    recharge.handleResetSelectedAmount();
    const element = e.target.closest(".recharge-amount__item");
    element.classList.add("active");
    element.querySelector("input[name='amount']").checked = true;
  },
  handleResetSelectedAmount: function () {
    const listAmountsItem = document.querySelectorAll(".recharge-amount__item");
    listAmountsItem.forEach((item) => {
      const element = item.closest(".recharge-amount__item");
      element.classList.remove("active");
    });
  },
  handleSelectType: function (e) {
    recharge.handleResetSelectedType();
    const element = e.target.closest(".recharge-type__item");
    element.classList.add("active");
    element.querySelector("input[name='type']").checked = true;
    document.querySelector("#show_type").innerText = helpers.camelize(
      recharge.getTypeChecked()
    );
  },
  handleResetSelectedType: function () {
    const listTypesItem = document.querySelectorAll(".recharge-type__item");
    listTypesItem.forEach((item) => {
      const element = item.closest(".recharge-type__item");
      element.classList.remove("active");
    });
  },
  getAmountChecked: function () {
    const eleAmountChecked = document.querySelector(
      "input[name='amount']:checked"
    );
    return eleAmountChecked ? eleAmountChecked.dataset.amount : undefined;
  },
  getTypeChecked: function () {
    const eleTypeChecked = document.querySelector("input[name='type']:checked");
    return eleTypeChecked ? eleTypeChecked.dataset.type : undefined;
  },
handleSubmitForm: function (e) {
  e.preventDefault();
  const type = recharge.getTypeChecked();
  const amount = recharge.getAmountChecked();
  const serial = $("#serial").val();
  const pin = $("#pin").val();
  const username = $("#username").val();
  const csrfToken = $("[name='_csrf']").val();
  const error = validationForm.checkHasError();
  const elementError = document.querySelector("#error_message");
  const elementSuccess = document.querySelector("#success_message");
  const [typeGame] = helpers.getGame();
  const typeLogin = document.querySelector("#account_type").value;

  if (error) {
    elementSuccess.innerText = "";
    elementError.innerText = error;
    return;
  } else {
    elementError.innerText = "";
  }

  $.ajax({
    type: "POST",
    url: "pay/card",
    contentType: "application/json",
    data: JSON.stringify({
      type, amount, serial, pin, username, typeGame, typeLogin, token: csrfToken
    }),
    beforeSend: function () {
      $('[class="recharge-form__button"]')[0].disabled = true;
      recharge.showLoading(true);
    },
    success: function (data) {
      if (data.status) {
        document.querySelector("#form_recharge").reset();
        elementSuccess.innerText = data.message;
        elementError.innerText = "";
      } else {
        elementSuccess.innerText = "";
        elementError.innerText = data.message;
      }
    },
    complete: function () {
      $('[class="recharge-form__button"]')[0].disabled = false;
      recharge.showLoading(false);
    },
  });
  recharge.showLoading(true);
},

  showLoading: function (isShow) {
    const bodyForm = document.querySelector("#bodyForm");
    const loading = document.querySelector("#loading");
    if (isShow) {
      bodyForm.classList.add("hidden");
      loading.classList.add("active");
    } else {
      bodyForm.classList.remove("hidden");
      loading.classList.remove("active");
    }
  },
};

const validationForm = {
  checkHasError: function () {
    const type = recharge.getTypeChecked();
    const amount = recharge.getAmountChecked();
    const serial = $("#serial").val();
    const pin = $("#pin").val();
    const username = $("#username").val();
    const accountType = document.querySelector("#account_type");
    const isAccept = helpers.getLabelAndPlaceholderByGame(accountType.value);

    if (!isAccept) {
      return "Cách đăng nhập này đang bảo trì, vui lòng thử cách khác";
    }
    if (validationForm.checkIsEmpty(type)) {
      return "Vui lòng chọn loại thẻ";
    }
    if (!validationForm.checkTypeValid(type)) {
      return "Loại thẻ không hợp lệ, vui lòng tải lại trang";
    }
    if (validationForm.checkIsEmpty(amount)) {
      return "Vui lòng chọn mệnh giá thẻ cào";
    }
    if (!validationForm.checkAmountValid(amount)) {
      return "Mệnh giá thẻ cào không hợp lệ, vui lòng tải lại trang";
    }
    if (validationForm.checkIsEmpty(serial)) {
      return "Vui lòng nhập số serial";
    }
    if (validationForm.checkIsEmpty(pin)) {
      return "Vui lòng nhập mã thẻ cào";
    }
    const [labelUsername] = helpers.getLabelAndPlaceholderByGame(
      accountType.value
    );
    if (validationForm.checkIsEmpty(username)) {
      return `Vui lòng nhập ${labelUsername.toLowerCase()}`;
    }

    return null;
  },
  checkIsEmpty: function (text) {
    return !text ? true : false;
  },
  checkAmountValid: function (amount) {
    const amountAccept = [
      10000, 20000, 30000, 50000, 100000, 200000, 500000, 1000000,
    ];
    return amountAccept.includes(parseInt(amount)) ? true : false;
  },
  checkTypeValid: function (type) {
    const typeAccept = [
      "VIETTEL",
      "VINAPHONE",
      "MOBIFONE",
      "ZING",
      "GARENA",
      "GATE",
      "VIETNAMOBILE",
    ];
    return typeAccept.includes(type.toUpperCase()) ? true : false;
  },
};

const helpers = {
  camelize: function (str) {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, function (word, index) {
        return index === 0 ? word.toUpperCase() : word.toLowerCase();
      })
      .replace(/\s+/g, "");
  },
  getGame: function () {
    const urlGame = location.pathname;
    const games = {
      "/app/10010/buy/0": ["nap_so", "Nạp Sò"],
      "/app/10020/buy/0": ["fifa_online4", "FIFA Online 4 (VN)"],
      "/app/10030/buy/0": ["fifa_online4m", "FIFA Online 4 M VN"],
      "/app/10040/buy/0": ["lien_quan", "Liên Quân Mobile"],
      "/app/10050/buy/0": ["free_fire", "Free Fire"],
      "/app/10060/buy/0": ["cai_the_tranh_hung", "Cái Thế Tranh Hùng"],
      "/app/10070/buy/0": ["blade_and_soul", "Blade and Soul"],
    };
    return games[urlGame] ? games[urlGame] : undefined;
  },
  getLabelAndPlaceholderByGame: function (type) {
    const game = helpers.getGame();
    const [, nameGame] = game;
    const types = {
      hlv: ["Tên HLV", `Vui lòng nhập tên HLV ${nameGame}`],
      garena: ["Tên đăng nhập garena", `Vui lòng nhập tên đăng nhập`],
      facebook: [
        "Tài khoản facebook",
        `Vui lòng nhập email hoặc số điện thoại đăng nhập Facebook`,
      ],
      uid: ["UID Tài khoản", `Vui lòng nhập UID tài khoản ${nameGame}`],
      id_apple: ["ID Apple", `Vui lòng nhập ID Apple`],
      vk: [
        "Tài khoản VK",
        `Vui lòng nhập email hoặc số điện thoại đăng nhập VK`,
      ],
      google: ["Tài khoản google", `Vui lòng nhập email đăng nhập google`],
      twitter: [
        "Tài khoản twitter",
        `Vui lòng nhập email, số điện thoại hoặc tên người dùng đăng nhập Twitter`,
      ],
    };
    return types[type];
  },
};

$(document).ready(function () {
  recharge.registerControl();
});