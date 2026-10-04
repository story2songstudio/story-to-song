document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll('a[href="#order"]');

  buttons.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      window.location.href = "https://buy.stripe.com/28E7sM6VoeYLery2fJ53O00";
    });
  });
});
